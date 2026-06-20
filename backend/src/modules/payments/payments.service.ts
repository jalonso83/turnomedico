import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RegisterPaymentDto } from './dto/register-payment.dto';
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
        patient: { select: { id: true, name: true } },
      },
    });
    if (!appointment) {
      throw new NotFoundException('Cita no encontrada');
    }
    return appointment;
  }

  /**
   * Contexto para abrir el modal de cobro: tarifa, ARS configuradas por el
   * doctor (con sus montos pactados) y el cobro existente si lo hay.
   */
  async getPaymentContext(appointmentId: string, tenantId: string) {
    const appointment = await this.getAppointmentInTenant(appointmentId, tenantId);

    const profile = await this.prisma.doctorProfile.findUnique({
      where: { tenantId },
      select: {
        consultationFee: true,
        currency: true,
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
    });

    return {
      data: {
        appointment: {
          id: appointment.id,
          reason: appointment.reason,
          status: appointment.status,
          patient: appointment.patient,
        },
        fee: profile?.consultationFee ?? null,
        currency: profile?.currency ?? 'DOP',
        insurances: (profile?.insurances ?? []).map((di) => ({
          id: di.insurance.id,
          name: di.insurance.name,
          shortName: di.insurance.shortName,
          patientCopay: di.patientCopay,
          insuranceCoverage: di.insuranceCoverage,
        })),
        payment,
      },
      message: 'Contexto de cobro',
    };
  }

  async upsertPayment(
    appointmentId: string,
    tenantId: string,
    userId: string | undefined,
    dto: RegisterPaymentDto,
  ) {
    const appointment = await this.getAppointmentInTenant(appointmentId, tenantId);

    const isCourtesy = dto.isCourtesy ?? false;
    const cashAmount = isCourtesy ? 0 : (dto.cashAmount ?? 0);
    const insuranceId = isCourtesy ? null : (dto.insuranceId || null);
    const insuranceAmount = isCourtesy ? 0 : (dto.insuranceAmount ?? 0);
    const fee = dto.fee ?? cashAmount + insuranceAmount;

    const profile = await this.prisma.doctorProfile.findUnique({
      where: { tenantId },
      select: { currency: true },
    });

    const payment = await this.prisma.consultationPayment.upsert({
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

    return { data: payment, message: 'Cobro registrado' };
  }

  /**
   * Resumen de caja por día (basado en la fecha de la cita en RD).
   * Separa efectivo (gaveta) de lo que se debe cobrar a cada ARS.
   */
  async getCashSummary(tenantId: string, dateStr?: string) {
    const day = dateStr || todayRDString();
    const date = dateOnlyUTC(day);

    const appointments = await this.prisma.appointment.findMany({
      where: { tenantId, date },
      select: {
        id: true,
        status: true,
        patient: { select: { id: true, name: true } },
        payment: {
          include: {
            insurance: { select: { id: true, name: true, shortName: true } },
          },
        },
      },
      orderBy: { queuePosition: 'asc' },
    });

    let cashTotal = 0;
    let insuranceTotal = 0;
    let paidCount = 0;
    let courtesyCount = 0;

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
        cashTotal,
        insuranceTotal,
        total: cashTotal + insuranceTotal,
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
