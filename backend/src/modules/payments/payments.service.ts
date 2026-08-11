import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  PaymentItemDto,
  PaymentItemKindEnum,
  RegisterPaymentDto,
} from './dto/register-payment.dto';
import { dateOnlyUTC, todayRDString } from '../../common/utils/timezone.util';

// Estados en los que el paciente ya llegó/fue atendido (cuentan para "pendientes de cobro").
const ATTENDED_STATUSES = ['ARRIVED', 'IN_PROGRESS', 'COMPLETED'] as const;

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getAppointmentInTenant(appointmentId: string, tenantId: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, tenantId },
      select: {
        id: true,
        patientId: true,
        reason: true,
        status: true,
        date: true,
        parentAppointmentId: true,
        parentAppointment: { select: { id: true, date: true } },
        patient: { select: { id: true, name: true } },
      },
    });
    if (!appointment) {
      throw new NotFoundException('Cita no encontrada');
    }
    return appointment;
  }

  /**
   * Contexto para abrir el modal de cobro: tarifa de consulta, ARS que el
   * doctor acepta (con sus montos pactados), catálogo de servicios activos
   * con su tarifa por ARS, y el cobro existente con sus líneas si lo hay.
   */
  async getPaymentContext(appointmentId: string, tenantId: string) {
    const appointment = await this.getAppointmentInTenant(appointmentId, tenantId);

    const profile = await this.prisma.doctorProfile.findUnique({
      where: { tenantId },
      select: {
        consultationFee: true,
        currency: true,
        followUpFreeDays: true,
        followUpFee: true,
        insurances: {
          select: {
            patientCopay: true,
            insuranceCoverage: true,
            insurance: {
              select: { id: true, name: true, shortName: true },
            },
          },
        },
      },
    });

    const payment = await this.prisma.consultationPayment.findUnique({
      where: { appointmentId },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });

    const services = await this.prisma.service.findMany({
      where: { tenantId, isActive: true },
      select: {
        id: true,
        name: true,
        price: true,
        category: true,
        insurances: {
          select: {
            insuranceId: true,
            patientCopay: true,
            insuranceCoverage: true,
          },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    // Tarifa de la consulta según el motivo de la cita.
    // Un seguimiento dentro de la ventana no se cobra; fuera de ella se cobra
    // la tarifa de seguimiento, y si no está configurada, la de consulta.
    const feeConsulta = profile?.consultationFee ?? null;
    let fee = feeConsulta;
    let motivoTarifa: string | null = null;

    if (appointment.reason === 'RESULTS_DELIVERY') {
      // Entregar resultados no es una consulta: por defecto no se cobra.
      // El efectivo sigue siendo editable por si este doctor sí la cobra.
      fee = 0;
      motivoTarifa = 'Entrega de resultados: no se cobra por defecto';
    } else if (appointment.reason === 'FOLLOW_UP') {
      const ventana = profile?.followUpFreeDays ?? 30;
      const origen = appointment.parentAppointment?.date ?? null;
      const dias = origen
        ? Math.round(
            (appointment.date.getTime() - origen.getTime()) / (1000 * 60 * 60 * 24),
          )
        : null;

      if (dias != null && dias <= ventana) {
        fee = 0;
        motivoTarifa = `Seguimiento dentro de los ${ventana} días: no se cobra la consulta`;
      } else {
        fee = profile?.followUpFee ?? feeConsulta;
        motivoTarifa =
          dias == null
            ? 'Seguimiento sin consulta de origen registrada'
            : `Seguimiento fuera de la ventana de ${ventana} días`;
      }
    }

    return {
      data: {
        appointment: {
          id: appointment.id,
          reason: appointment.reason,
          status: appointment.status,
          patient: appointment.patient,
          parentAppointmentId: appointment.parentAppointmentId,
        },
        fee,
        /** Tarifa normal de consulta, por si el doctor quiere cobrarla igual. */
        consultationFee: feeConsulta,
        /** Explicación de por qué se propone esta tarifa. null si es lo normal. */
        feeReason: motivoTarifa,
        currency: profile?.currency ?? 'DOP',
        insurances: (profile?.insurances ?? []).map((di) => ({
          id: di.insurance.id,
          name: di.insurance.name,
          shortName: di.insurance.shortName,
          patientCopay: di.patientCopay,
          insuranceCoverage: di.insuranceCoverage,
        })),
        services,
        payment,
      },
      message: 'Contexto de cobro',
    };
  }

  /**
   * Normaliza la entrada a un arreglo de líneas.
   * Si el cliente no manda `items` (camino legacy), se arma una sola línea
   * CONSULTATION con los montos planos de siempre.
   */
  private buildItems(dto: RegisterPaymentDto, isCourtesy: boolean) {
    const source: PaymentItemDto[] =
      dto.items && dto.items.length > 0
        ? dto.items
        : [
            {
              kind: PaymentItemKindEnum.CONSULTATION,
              description: 'Consulta',
              unitPrice: dto.fee ?? (dto.cashAmount ?? 0) + (dto.insuranceAmount ?? 0),
              quantity: 1,
              cashAmount: dto.cashAmount ?? 0,
              insuranceAmount: dto.insuranceAmount ?? 0,
            },
          ];

    return source.map((it, idx) => ({
      kind: it.kind,
      serviceId: it.kind === PaymentItemKindEnum.SERVICE ? (it.serviceId ?? null) : null,
      description: it.description.trim().slice(0, 200),
      unitPrice: it.unitPrice,
      quantity: it.quantity ?? 1,
      // La cortesía pone todo en cero, pero conserva las líneas para dejar
      // constancia de qué se le hizo al paciente sin cobrarle.
      cashAmount: isCourtesy ? 0 : it.cashAmount,
      insuranceAmount: isCourtesy ? 0 : (it.insuranceAmount ?? 0),
      sortOrder: idx,
    }));
  }

  async upsertPayment(
    appointmentId: string,
    tenantId: string,
    userId: string | undefined,
    dto: RegisterPaymentDto,
  ) {
    const appointment = await this.getAppointmentInTenant(appointmentId, tenantId);

    // Un día cerrado no se toca. Es lo único que hace que el cierre sirva
    // de algo: si no, sería un reporte decorativo.
    const cerrado = await this.prisma.cashClosing.findUnique({
      where: { tenantId_date: { tenantId, date: appointment.date } },
      select: { id: true },
    });
    if (cerrado) {
      throw new ConflictException(
        'La caja de ese día ya está cerrada. Reábrela para poder editar el cobro.',
      );
    }

    const isCourtesy = dto.isCourtesy ?? false;
    const insuranceId = isCourtesy ? null : dto.insuranceId || null;
    const items = this.buildItems(dto, isCourtesy);

    // Los servicios referenciados tienen que ser de este consultorio.
    // Si no, un id ajeno se colaría al histórico de facturación.
    const serviceIds = [...new Set(items.map((i) => i.serviceId).filter(Boolean))] as string[];
    if (serviceIds.length > 0) {
      const owned = await this.prisma.service.count({
        where: { id: { in: serviceIds }, tenantId },
      });
      if (owned !== serviceIds.length) {
        throw new BadRequestException('Hay un servicio que no pertenece a este consultorio');
      }
    }

    // Los totales de la cabecera SIEMPRE se calculan aquí, nunca los manda
    // el cliente. Así no pueden divergir de la suma de las líneas.
    const fee = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    const cashAmount = items.reduce((sum, i) => sum + i.cashAmount, 0);
    const insuranceAmount = items.reduce((sum, i) => sum + i.insuranceAmount, 0);

    const profile = await this.prisma.doctorProfile.findUnique({
      where: { tenantId },
      select: { currency: true },
    });

    const payment = await this.prisma.$transaction(async (tx) => {
      const header = await tx.consultationPayment.upsert({
        where: { appointmentId },
        create: {
          appointmentId,
          tenantId,
          patientId: appointment.patientId,
          fee,
          cashAmount,
          insuranceId,
          insuranceAmount,
          currency: profile?.currency ?? 'DOP',
          isCourtesy,
          registeredById: userId ?? null,
          notes: dto.notes ?? null,
        },
        update: {
          fee,
          cashAmount,
          insuranceId,
          insuranceAmount,
          isCourtesy,
          registeredById: userId ?? null,
          notes: dto.notes ?? null,
        },
      });

      // Reemplazo completo: es más simple y seguro que reconciliar líneas,
      // y el volumen por factura es de unas pocas filas.
      await tx.paymentItem.deleteMany({ where: { paymentId: header.id } });
      await tx.paymentItem.createMany({
        data: items.map((i) => ({ ...i, paymentId: header.id })),
      });

      return tx.consultationPayment.findUniqueOrThrow({
        where: { id: header.id },
        include: { items: { orderBy: { sortOrder: 'asc' } } },
      });
    });

    return { data: payment, message: 'Cobro registrado' };
  }

  /**
   * Cierra la caja de un día. Congela los cobros de esa fecha.
   *
   * El valor del cierre no es el reporte, es el congelamiento: sin eso,
   * cualquiera podría editar un cobro de un día ya cuadrado.
   */
  async closeDay(
    tenantId: string,
    userId: string | undefined,
    dto: { date: string; cashCounted: number; notes?: string },
  ) {
    const date = this.parseDate(dto.date);

    const yaCerrado = await this.prisma.cashClosing.findUnique({
      where: { tenantId_date: { tenantId, date } },
      select: { id: true },
    });
    if (yaCerrado) {
      throw new ConflictException('La caja de ese día ya está cerrada');
    }

    const resumen = (await this.getCashSummary(tenantId, dto.date)).data;
    if (resumen.paidCount === 0 && resumen.courtesyCount === 0) {
      throw new BadRequestException('No hay cobros registrados ese día');
    }

    const closing = await this.prisma.$transaction(async (tx) => {
      const c = await tx.cashClosing.create({
        data: {
          tenantId,
          date,
          consultationsTotal: resumen.consultationsTotal,
          servicesTotal: resumen.servicesTotal,
          insuranceTotal: resumen.insuranceTotal,
          cashExpected: resumen.cashTotal,
          cashCounted: dto.cashCounted,
          difference: dto.cashCounted - resumen.cashTotal,
          closedById: userId ?? null,
          notes: dto.notes ?? null,
        },
      });

      // Amarrar los cobros del día al cierre: es lo que los bloquea.
      await tx.consultationPayment.updateMany({
        where: { tenantId, appointment: { date } },
        data: { closingId: c.id },
      });

      return c;
    });

    return {
      data: { ...closing, pendingCount: resumen.pendingCount },
      message: 'Caja cerrada',
    };
  }

  async getClosing(tenantId: string, dateStr: string) {
    const date = this.parseDate(dateStr);
    const closing = await this.prisma.cashClosing.findUnique({
      where: { tenantId_date: { tenantId, date } },
      include: { closedBy: { select: { id: true, name: true } } },
    });
    return { data: closing, message: closing ? 'Cierre del día' : 'Sin cierre' };
  }

  /** Reabre un día cerrado. Solo el doctor, y queda registrado en las notas. */
  async reopenDay(tenantId: string, id: string, userId: string | undefined) {
    const closing = await this.prisma.cashClosing.findFirst({
      where: { id, tenantId },
      select: { id: true, notes: true, date: true },
    });
    if (!closing) {
      throw new NotFoundException('Cierre no encontrado');
    }

    await this.prisma.$transaction([
      this.prisma.consultationPayment.updateMany({
        where: { closingId: closing.id },
        data: { closingId: null },
      }),
      this.prisma.cashClosing.delete({ where: { id: closing.id } }),
    ]);

    return {
      data: { date: closing.date, reopenedBy: userId ?? null },
      message: 'Caja reabierta',
    };
  }

  /** Valida 'YYYY-MM-DD' y descarta fechas que no existen (ej. 2026-13-45). */
  private parseDate(dateStr: string): Date {
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      throw new BadRequestException('Formato de fecha inválido. Use YYYY-MM-DD');
    }
    const d = dateOnlyUTC(dateStr);
    if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== dateStr) {
      throw new BadRequestException('Esa fecha no existe en el calendario');
    }
    return d;
  }

  /**
   * Facturación día por día en un rango, más los totales del período.
   * Reutiliza el resumen de un día, que es el caso degenerado del rango.
   */
  async getCashRange(tenantId: string, fromStr: string, toStr: string) {
    const from = this.parseDate(fromStr);
    const to = this.parseDate(toStr);

    if (to < from) {
      throw new BadRequestException('La fecha final es anterior a la inicial');
    }
    const dias = Math.round((to.getTime() - from.getTime()) / 86400000) + 1;
    if (dias > 366) {
      throw new BadRequestException('El rango no puede pasar de 366 días');
    }

    const dailies: Awaited<ReturnType<typeof this.getCashSummary>>['data'][] = [];
    for (let i = 0; i < dias; i++) {
      const d = new Date(from.getTime() + i * 86400000).toISOString().slice(0, 10);
      const res = await this.getCashSummary(tenantId, d);
      dailies.push(res.data);
    }

    // Solo se devuelven los días con movimiento: un mes entero de ceros no
    // aporta nada y hace la tabla ilegible.
    const conMovimiento = dailies.filter(
      (d) => d.total > 0 || d.paidCount > 0 || d.courtesyCount > 0 || d.pendingCount > 0,
    );

    const suma = (k: 'cashTotal' | 'insuranceTotal' | 'total' | 'consultationsTotal' | 'servicesTotal') =>
      dailies.reduce((s, d) => s + (d[k] as number), 0);

    const porArs = new Map<string, { insuranceId: string; name: string; shortName: string | null; amount: number; count: number }>();
    for (const d of dailies) {
      for (const a of d.byInsurance) {
        const e = porArs.get(a.insuranceId) ?? { ...a, amount: 0, count: 0 };
        e.amount += a.amount;
        e.count += a.count;
        porArs.set(a.insuranceId, e);
      }
    }

    return {
      data: {
        from: fromStr,
        to: toStr,
        days: conMovimiento.map((d) => ({
          date: d.date,
          cashTotal: d.cashTotal,
          insuranceTotal: d.insuranceTotal,
          consultationsTotal: d.consultationsTotal,
          servicesTotal: d.servicesTotal,
          total: d.total,
          paidCount: d.paidCount,
          courtesyCount: d.courtesyCount,
          pendingCount: d.pendingCount,
          isClosed: d.isClosed,
        })),
        totals: {
          cashTotal: suma('cashTotal'),
          insuranceTotal: suma('insuranceTotal'),
          consultationsTotal: suma('consultationsTotal'),
          servicesTotal: suma('servicesTotal'),
          total: suma('total'),
          diasConMovimiento: conMovimiento.length,
          byInsurance: Array.from(porArs.values()).sort((a, b) => b.amount - a.amount),
        },
      },
      message: 'Facturación por días',
    };
  }

  /**
   * Resumen de caja por día (basado en la fecha de la cita en RD).
   * Separa efectivo (gaveta) de lo que se debe cobrar a cada ARS.
   */
  async getCashSummary(tenantId: string, dateStr?: string) {
    const day = dateStr || todayRDString();
    const date = this.parseDate(day);

    const closing = await this.prisma.cashClosing.findUnique({
      where: { tenantId_date: { tenantId, date } },
      select: { id: true, cashCounted: true, difference: true, closedAt: true },
    });

    const appointments = await this.prisma.appointment.findMany({
      where: { tenantId, date },
      select: {
        id: true,
        status: true,
        patient: { select: { id: true, name: true } },
        payment: {
          include: {
            insurance: { select: { id: true, name: true, shortName: true } },
            items: { select: { kind: true, cashAmount: true, insuranceAmount: true } },
          },
        },
      },
      orderBy: { queuePosition: 'asc' },
    });

    let cashTotal = 0;
    let insuranceTotal = 0;
    let paidCount = 0;
    let courtesyCount = 0;
    let consultationsTotal = 0;
    let servicesTotal = 0;

    const byInsuranceMap = new Map<
      string,
      { insuranceId: string; name: string; shortName: string | null; amount: number; count: number }
    >();

    const pending: Array<{ appointmentId: string; patientName: string }> = [];

    for (const appt of appointments) {
      const attended = (ATTENDED_STATUSES as readonly string[]).includes(appt.status);

      if (!appt.payment) {
        if (attended) {
          pending.push({ appointmentId: appt.id, patientName: appt.patient.name });
        }
        continue;
      }

      const p = appt.payment;
      cashTotal += p.cashAmount;
      insuranceTotal += p.insuranceAmount;

      // Desglose consulta vs servicios. Los cobros anteriores a las líneas
      // no tienen items: se cuentan enteros como consulta, que es lo que eran.
      if (p.items.length === 0) {
        consultationsTotal += p.cashAmount + p.insuranceAmount;
      } else {
        for (const it of p.items) {
          const total = it.cashAmount + it.insuranceAmount;
          if (it.kind === 'CONSULTATION') consultationsTotal += total;
          else servicesTotal += total;
        }
      }

      if (p.isCourtesy) {
        courtesyCount += 1;
      } else {
        paidCount += 1;
      }

      if (p.insuranceAmount > 0 && p.insurance) {
        const key = p.insurance.id;
        const entry = byInsuranceMap.get(key) ?? {
          insuranceId: p.insurance.id,
          name: p.insurance.name,
          shortName: p.insurance.shortName,
          amount: 0,
          count: 0,
        };
        entry.amount += p.insuranceAmount;
        entry.count += 1;
        byInsuranceMap.set(key, entry);
      }
    }

    return {
      data: {
        date: day,
        isClosed: closing != null,
        closing,
        cashTotal,
        insuranceTotal,
        total: cashTotal + insuranceTotal,
        consultationsTotal,
        servicesTotal,
        paidCount,
        courtesyCount,
        pendingCount: pending.length,
        byInsurance: Array.from(byInsuranceMap.values()).sort((a, b) => b.amount - a.amount),
        pending,
      },
      message: 'Caja del día',
    };
  }
}
