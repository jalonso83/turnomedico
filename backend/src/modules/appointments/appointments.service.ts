import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { BookAppointmentDto } from './dto/book-appointment.dto';
import { UpdateStatusDto, AppointmentStatusEnum } from './dto/update-status.dto';
import {
  dateOnlyUTC,
  todayRDDate,
  todayRDString,
  currentTimeRDString,
} from '../../common/utils/timezone.util';

// Valid state transitions map
const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED_PATIENT', 'CANCELLED_DOCTOR', 'NO_SHOW'],
  CONFIRMED: ['ARRIVED', 'CANCELLED_PATIENT', 'CANCELLED_DOCTOR', 'NO_SHOW'],
  ARRIVED: ['IN_PROGRESS', 'CANCELLED_PATIENT', 'CANCELLED_DOCTOR', 'NO_SHOW'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED_DOCTOR'],
  COMPLETED: [],
  CANCELLED_PATIENT: [],
  CANCELLED_DOCTOR: [],
  NO_SHOW: [],
};

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getTodayAppointments(tenantId: string) {
    return this.getAppointmentsByDate(tenantId);
  }

  /**
   * Agenda de un día cualquiera. Sin `dateStr` devuelve la de hoy.
   * La secretaria necesita poder abrir días futuros para prepararlos.
   */
  async getAppointmentsByDate(tenantId: string, dateStr?: string) {
    if (dateStr && !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      throw new BadRequestException('Formato de fecha inválido. Use YYYY-MM-DD');
    }
    const today = dateStr ? dateOnlyUTC(dateStr) : this.getTodayDR();

    const appointments = await this.prisma.appointment.findMany({
      where: {
        tenantId,
        date: today,
      },
      include: {
        patient: {
          select: { id: true, name: true, phone: true },
        },
        payment: {
          select: { cashAmount: true, insuranceAmount: true, isCourtesy: true },
        },
        // Para saber a quién ya se le avisó su turno por WhatsApp.
        notifications: {
          where: { type: 'CONFIRMATION' },
          select: { sentAt: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    // Custom sort: ARRIVED/IN_PROGRESS first (by queuePosition), then CONFIRMED/PENDING (by startTime), then terminal states
    const priorityOrder: Record<string, number> = {
      IN_PROGRESS: 0,
      ARRIVED: 1,
      CONFIRMED: 2,
      PENDING: 3,
      COMPLETED: 4,
      NO_SHOW: 5,
      CANCELLED_PATIENT: 6,
      CANCELLED_DOCTOR: 7,
    };

    appointments.sort((a, b) => {
      const pa = priorityOrder[a.status] ?? 99;
      const pb = priorityOrder[b.status] ?? 99;
      if (pa !== pb) return pa - pb;

      // Dentro del mismo grupo manda el número de turno.
      // Las citas SIN turno (aún no confirmadas por la secretaria) van al
      // final, ordenadas por cuándo entró la reserva. Antes usaban 999 como
      // relleno y quedaban todas empatadas, en orden indefinido.
      const qa = a.queuePosition ?? Number.MAX_SAFE_INTEGER;
      const qb = b.queuePosition ?? Number.MAX_SAFE_INTEGER;
      if (qa !== qb) return qa - qb;
      if (a.queuePosition == null && b.queuePosition == null) {
        return a.createdAt.getTime() - b.createdAt.getTime();
      }
      return (a.startTime ?? '').localeCompare(b.startTime ?? '');
    });

    // Citas que cuentan para el split de motivos (excluye canceladas/no-show)
    const activeForReasonSplit = appointments.filter(
      (a) =>
        a.status !== 'CANCELLED_PATIENT' &&
        a.status !== 'CANCELLED_DOCTOR' &&
        a.status !== 'NO_SHOW',
    );

    // Calculate stats
    const stats = {
      total: appointments.length,
      completed: appointments.filter((a) => a.status === 'COMPLETED').length,
      arrived: appointments.filter((a) => a.status === 'ARRIVED').length,
      inProgress: appointments.filter((a) => a.status === 'IN_PROGRESS').length,
      pending: appointments.filter((a) => a.status === 'PENDING' || a.status === 'CONFIRMED').length,
      noShows: appointments.filter((a) => a.status === 'NO_SHOW').length,
      cancelled: appointments.filter((a) =>
        a.status === 'CANCELLED_PATIENT' || a.status === 'CANCELLED_DOCTOR',
      ).length,
      consultations: activeForReasonSplit.filter((a) => a.reason === 'CONSULTATION').length,
      resultsDeliveries: activeForReasonSplit.filter((a) => a.reason === 'RESULTS_DELIVERY').length,
    };

    const data = appointments.map((a) => ({
      id: a.id,
      date: a.date,
      startTime: a.startTime,
      endTime: a.endTime,
      status: a.status,
      type: a.type,
      reason: a.reason,
      queuePosition: a.queuePosition,
      /** Cuándo se le avisó su turno. null = todavía no se le ha avisado. */
      notifiedAt: a.notifications[0]?.sentAt ?? null,
      notes: a.notes,
      patient: a.patient,
      payment: a.payment
        ? {
            paid: true,
            isCourtesy: a.payment.isCourtesy,
            total: a.payment.cashAmount + a.payment.insuranceAmount,
          }
        : null,
      arrivedAt: a.arrivedAt,
      startedAt: a.startedAt,
      completedAt: a.completedAt,
    }));

    return {
      data: { appointments: data, stats },
      message: 'Agenda del día',
    };
  }

  /** Estados que ya no cuentan para el turno del día. */
  private readonly DEAD_STATUSES: AppointmentStatus[] = [
    'CANCELLED_PATIENT',
    'CANCELLED_DOCTOR',
    'NO_SHOW',
  ];

  /**
   * Reordena los turnos de un día. Recibe los ids en el orden deseado y les
   * asigna 1..N. Solo se pueden mover citas que aún no han llegado: si el
   * paciente ya está en el consultorio, su turno está en curso.
   */
  async reorderQueue(tenantId: string, dateStr: string, orderedIds: string[]) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      throw new BadRequestException('Formato de fecha inválido. Use YYYY-MM-DD');
    }
    const date = dateOnlyUTC(dateStr);

    const delDia = await this.prisma.appointment.findMany({
      where: { tenantId, date, status: { notIn: this.DEAD_STATUSES } },
      select: { id: true, status: true, queuePosition: true },
    });

    const validos = new Set(delDia.map((a) => a.id));
    for (const id of orderedIds) {
      if (!validos.has(id)) {
        throw new BadRequestException('Hay una cita que no es de este día o no existe');
      }
    }
    if (new Set(orderedIds).size !== orderedIds.length) {
      throw new BadRequestException('Hay una cita repetida en el orden');
    }

    const enCurso = delDia.filter(
      (a) => a.status === 'ARRIVED' || a.status === 'IN_PROGRESS' || a.status === 'COMPLETED',
    );
    const moviendoEnCurso = enCurso.filter((a) => {
      const idx = orderedIds.indexOf(a.id);
      return idx >= 0 && a.queuePosition != null && a.queuePosition !== idx + 1;
    });
    if (moviendoEnCurso.length > 0) {
      throw new BadRequestException(
        'No se puede cambiar el turno de un paciente que ya llegó o fue atendido',
      );
    }

    await this.prisma.$transaction(
      orderedIds.map((id, idx) =>
        this.prisma.appointment.update({
          where: { id },
          data: { queuePosition: idx + 1 },
        }),
      ),
    );

    return this.getAppointmentsByDate(tenantId, dateStr);
  }

  /**
   * Confirma el día y numera los turnos.
   *
   * Regla clave: a quien YA tiene número no se le toca. Si durante el día
   * entran reservas nuevas y la secretaria vuelve a pulsar el botón, no se
   * puede renumerar a alguien a quien ya le dijeron por WhatsApp "eres el 3ro".
   * Las nuevas se numeran a continuación, por orden de llegada de la reserva.
   */
  async confirmDay(tenantId: string, dateStr: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      throw new BadRequestException('Formato de fecha inválido. Use YYYY-MM-DD');
    }
    const date = dateOnlyUTC(dateStr);

    const citas = await this.prisma.appointment.findMany({
      where: { tenantId, date, status: { notIn: this.DEAD_STATUSES } },
      select: { id: true, status: true, queuePosition: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    if (citas.length === 0) {
      throw new BadRequestException('No hay citas para ese día');
    }

    let maxQueue = citas.reduce((m, c) => Math.max(m, c.queuePosition ?? 0), 0);
    const sinTurno = citas.filter((c) => c.queuePosition == null);
    const porConfirmar = citas.filter((c) => c.status === 'PENDING');

    await this.prisma.$transaction([
      ...sinTurno.map((c) =>
        this.prisma.appointment.update({
          where: { id: c.id },
          data: { queuePosition: ++maxQueue },
        }),
      ),
      ...porConfirmar.map((c) =>
        this.prisma.appointment.update({
          where: { id: c.id },
          data: { status: 'CONFIRMED' },
        }),
      ),
    ]);

    return {
      data: {
        date: dateStr,
        numeradas: sinTurno.length,
        confirmadas: porConfirmar.length,
      },
      message: 'Día confirmado',
    };
  }

  /**
   * Deja constancia de que se le avisó al paciente.
   * Se guarda en el modelo Notification, que ya existía sin usarse.
   */
  async markNotified(tenantId: string, appointmentId: string, content: string) {
    const cita = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, tenantId },
      select: { id: true, patientId: true, queuePosition: true },
    });
    if (!cita) {
      throw new NotFoundException('Cita no encontrada');
    }
    if (cita.queuePosition == null) {
      throw new BadRequestException(
        'Esta cita todavía no tiene turno asignado: confirma el día primero',
      );
    }

    const notif = await this.prisma.notification.create({
      data: {
        tenantId,
        appointmentId: cita.id,
        patientId: cita.patientId,
        type: 'CONFIRMATION',
        channel: 'WHATSAPP',
        status: 'SENT',
        sentAt: new Date(),
        content,
      },
      select: { id: true, sentAt: true },
    });

    return { data: notif, message: 'Aviso registrado' };
  }

  async updateStatus(appointmentId: string, dto: UpdateStatusDto, tenantId: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, tenantId },
    });

    if (!appointment) {
      throw new NotFoundException('Cita no encontrada');
    }

    const allowedNext = VALID_TRANSITIONS[appointment.status] ?? [];
    if (!allowedNext.includes(dto.status)) {
      throw new BadRequestException(
        `No se puede cambiar de ${appointment.status} a ${dto.status}`,
      );
    }

    const updateData: any = {
      status: dto.status,
    };

    if (dto.cancelReason) {
      updateData.cancelReason = dto.cancelReason;
    }

    const now = new Date();

    switch (dto.status) {
      case AppointmentStatusEnum.ARRIVED: {
        updateData.arrivedAt = now;
        // Solo se asigna turno si NO tiene.
        // Antes se reasignaba siempre, así que el número que el paciente
        // había recibido al reservar cambiaba al llegar: quien reservó de
        // tercero y llegaba último terminaba con el número más alto.
        // Si la secretaria ya ordenó el día y avisó por WhatsApp, ese
        // número no se puede mover.
        if (appointment.queuePosition == null) {
          const maxQueue = await this.prisma.appointment.aggregate({
            where: {
              tenantId,
              date: appointment.date,
              queuePosition: { not: null },
            },
            _max: { queuePosition: true },
          });
          updateData.queuePosition = (maxQueue._max.queuePosition ?? 0) + 1;
        }
        break;
      }
      case AppointmentStatusEnum.IN_PROGRESS:
        updateData.startedAt = now;
        break;
      case AppointmentStatusEnum.COMPLETED:
        updateData.completedAt = now;
        break;
    }

    const updated = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: updateData,
      include: {
        patient: {
          select: { id: true, name: true, phone: true },
        },
      },
    });

    return {
      data: {
        id: updated.id,
        date: updated.date,
        startTime: updated.startTime,
        endTime: updated.endTime,
        status: updated.status,
        type: updated.type,
        queuePosition: updated.queuePosition,
        patient: updated.patient,
        arrivedAt: updated.arrivedAt,
        startedAt: updated.startedAt,
        completedAt: updated.completedAt,
      },
      message: 'Estado de cita actualizado',
    };
  }

  async createWalkIn(
    tenantId: string,
    data: { patientName: string; patientPhone: string; notes?: string; reason?: 'CONSULTATION' | 'RESULTS_DELIVERY' },
  ) {
    const today = this.getTodayDR();
    const nowTime = this.getCurrentTimeDR();

    // Find or create patient
    let patient = await this.prisma.patient.findUnique({
      where: { phone: data.patientPhone },
    });

    if (!patient) {
      patient = await this.prisma.patient.create({
        data: {
          phone: data.patientPhone,
          name: data.patientName,
        },
      });
    }

    // Find or create tenant-patient relationship
    await this.prisma.tenantPatient.upsert({
      where: {
        tenantId_patientId: { tenantId, patientId: patient.id },
      },
      create: { tenantId, patientId: patient.id },
      update: {},
    });

    // Get next queue position
    const maxQueue = await this.prisma.appointment.aggregate({
      where: {
        tenantId,
        date: today,
        queuePosition: { not: null },
      },
      _max: { queuePosition: true },
    });
    const nextQueue = (maxQueue._max.queuePosition ?? 0) + 1;

    // Get schedule to determine slot duration for endTime
    const dayOfWeek = today.getUTCDay();
    const schedule = await this.prisma.schedule.findUnique({
      where: { tenantId_dayOfWeek: { tenantId, dayOfWeek } },
    });
    const slotDuration = schedule?.slotDurationMin ?? 30;

    const endTimeMinutes = this.timeToMinutes(nowTime) + slotDuration;
    const endTime = this.minutesToTime(endTimeMinutes);

    const appointment = await this.prisma.appointment.create({
      data: {
        tenantId,
        patientId: patient.id,
        date: today,
        startTime: nowTime,
        endTime,
        status: 'ARRIVED',
        type: 'FIRST_VISIT',
        reason: data.reason ?? 'CONSULTATION',
        queuePosition: nextQueue,
        arrivedAt: new Date(),
        notes: data.notes ?? null,
      },
      include: {
        patient: {
          select: { id: true, name: true, phone: true },
        },
      },
    });

    return {
      data: {
        id: appointment.id,
        date: appointment.date,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        status: appointment.status,
        type: appointment.type,
        reason: appointment.reason,
        queuePosition: appointment.queuePosition,
        patient: appointment.patient,
      },
      message: 'Paciente walk-in registrado',
    };
  }

  /**
   * Reserva un turno. El paciente no escoge hora — el sistema asigna el siguiente
   * número de turno (queuePosition) del día. Si el doctor configuró maxAppointments,
   * se valida el tope antes de crear.
   */
  async bookAppointment(slug: string, dto: BookAppointmentDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      include: {
        doctorProfile: true,
        users: {
          where: { role: 'DOCTOR' },
          select: { name: true },
          take: 1,
        },
      },
    });

    if (!tenant || !tenant.doctorProfile) {
      throw new NotFoundException('Doctor no encontrado');
    }

    if (!tenant.doctorProfile.agendaActive) {
      throw new BadRequestException('La agenda de este doctor no está activa');
    }

    const date = dateOnlyUTC(dto.date);
    const tenantId = tenant.id;
    const dayOfWeek = date.getUTCDay();

    // Día bloqueado por override
    const override = await this.prisma.scheduleOverride.findUnique({
      where: { tenantId_date: { tenantId, date } },
    });
    if (override?.isBlocked) {
      throw new BadRequestException('El doctor no atiende ese día');
    }

    const schedule = await this.prisma.schedule.findUnique({
      where: { tenantId_dayOfWeek: { tenantId, dayOfWeek } },
    });

    if (!schedule || !schedule.isActive) {
      throw new BadRequestException('No hay horario disponible para este día');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Lock advisory por (tenant, date) para evitar carrera entre dos reservas simultáneas
      const lockKey = `${tenantId}:${dto.date}`;
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;

      const activeAppointments = await tx.appointment.findMany({
        where: {
          tenantId,
          date,
          status: { notIn: ['CANCELLED_PATIENT', 'CANCELLED_DOCTOR', 'NO_SHOW'] },
        },
        select: { queuePosition: true },
      });

      // Validar tope de cupos. Cuenta FILAS, no números de turno, así que
      // sigue funcionando aunque las reservas ya no traigan turno asignado.
      if (schedule.maxAppointments != null && activeAppointments.length >= schedule.maxAppointments) {
        throw new ConflictException('Ya no quedan cupos para ese día');
      }

      // Find or create patient
      let patient = await tx.patient.findUnique({
        where: { phone: dto.patientPhone },
      });

      if (!patient) {
        patient = await tx.patient.create({
          data: {
            phone: dto.patientPhone,
            name: dto.patientName,
          },
        });
      }

      // Find or create tenant-patient
      await tx.tenantPatient.upsert({
        where: {
          tenantId_patientId: { tenantId, patientId: patient.id },
        },
        create: { tenantId, patientId: patient.id },
        update: {},
      });

      // Compatibilidad: si el cliente envió startTime, lo guardamos como dato extra.
      const startTime = dto.startTime ?? null;

      // La reserva NO asigna turno ni confirma.
      // El número lo pone la secretaria cuando ordena el día, y en ese mismo
      // acto le avisa al paciente. `queuePosition == null` es justamente la
      // señal de "todavía no se le avisó", así que no hace falta otro campo.
      const appointment = await tx.appointment.create({
        data: {
          tenantId,
          patientId: patient.id,
          date,
          startTime,
          endTime: null,
          queuePosition: null,
          status: 'PENDING',
          type: 'FIRST_VISIT',
          reason: dto.reason,
        },
      });

      return { appointment, patient };
    });

    return {
      data: {
        appointmentId: result.appointment.id,
        date: result.appointment.date,
        queuePosition: null,
        doctorStartTime: override?.startTime ?? schedule.startTime,
        status: result.appointment.status,
        reason: result.appointment.reason,
        doctorName: tenant.users[0]?.name ?? tenant.name,
        consultorioName: tenant.doctorProfile.consultorioName,
      },
      message: 'Solicitud recibida. El consultorio la confirmará y te enviará tu turno.',
    };
  }

  /**
   * Devuelve la disponibilidad de un día como cupos (no horas).
   * El paciente reserva un turno, no una hora específica.
   */
  async getAvailableSlots(slug: string, date: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!tenant) {
      throw new NotFoundException('Doctor no encontrado');
    }

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException('Formato de fecha inválido. Use YYYY-MM-DD');
    }

    const dateObj = dateOnlyUTC(date);
    const dayOfWeek = dateObj.getUTCDay();

    const baseResponse = {
      date,
      dayOpen: false as boolean,
      doctorStartTime: null as string | null,
      maxAppointments: null as number | null,
      takenCount: 0,
      availableCount: null as number | null,
      reason: undefined as undefined | 'blocked' | 'closed' | 'full',
    };

    // Override del día (bloqueado o con horario especial)
    const override = await this.prisma.scheduleOverride.findUnique({
      where: { tenantId_date: { tenantId: tenant.id, date: dateObj } },
    });

    if (override?.isBlocked) {
      return {
        data: { ...baseResponse, reason: 'blocked' },
        message: 'Día bloqueado',
      };
    }

    const schedule = await this.prisma.schedule.findUnique({
      where: { tenantId_dayOfWeek: { tenantId: tenant.id, dayOfWeek } },
    });

    if (!schedule || !schedule.isActive) {
      return {
        data: { ...baseResponse, reason: 'closed' },
        message: 'Día no laboral',
      };
    }

    // Cuenta de citas activas para ese día
    const takenCount = await this.prisma.appointment.count({
      where: {
        tenantId: tenant.id,
        date: dateObj,
        status: { notIn: ['CANCELLED_PATIENT', 'CANCELLED_DOCTOR', 'NO_SHOW'] },
      },
    });

    const max = schedule.maxAppointments ?? null;
    const availableCount = max != null ? Math.max(0, max - takenCount) : null;

    const data = {
      ...baseResponse,
      dayOpen: true,
      doctorStartTime: override?.startTime ?? schedule.startTime,
      maxAppointments: max,
      takenCount,
      availableCount,
      reason: max != null && availableCount === 0 ? ('full' as const) : undefined,
    };

    return { data, message: 'Disponibilidad del día' };
  }

  async getAppointmentPublic(appointmentId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: { select: { name: true, phone: true } },
        tenant: {
          include: {
            doctorProfile: {
              select: {
                specialty: true,
                consultorioName: true,
                address: true,
                floor: true,
                reference: true,
                city: true,
              },
            },
            users: {
              where: { role: 'DOCTOR' },
              select: { name: true },
              take: 1,
            },
          },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Cita no encontrada');
    }

    // Hora de inicio del doctor ese día (para que el paciente sepa a qué hora estará atendiendo)
    const dayOfWeek = new Date(appointment.date).getUTCDay();
    const [override, schedule] = await Promise.all([
      this.prisma.scheduleOverride.findUnique({
        where: { tenantId_date: { tenantId: appointment.tenantId, date: appointment.date } },
        select: { startTime: true },
      }),
      this.prisma.schedule.findUnique({
        where: { tenantId_dayOfWeek: { tenantId: appointment.tenantId, dayOfWeek } },
        select: { startTime: true },
      }),
    ]);
    const doctorStartTime = override?.startTime ?? schedule?.startTime ?? null;

    return {
      id: appointment.id,
      date: appointment.date,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      queuePosition: appointment.queuePosition,
      doctorStartTime,
      status: appointment.status,
      type: appointment.type,
      reason: appointment.reason,
      doctorName: appointment.tenant.users[0]?.name ?? appointment.tenant.name,
      specialty: appointment.tenant.doctorProfile?.specialty,
      consultorioName: appointment.tenant.doctorProfile?.consultorioName,
      address: appointment.tenant.doctorProfile?.address,
      floor: appointment.tenant.doctorProfile?.floor,
      reference: appointment.tenant.doctorProfile?.reference,
      city: appointment.tenant.doctorProfile?.city,
      patientName: appointment.patient.name,
      patientPhone: appointment.patient.phone,
    };
  }

  async cancelAppointment(appointmentId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new NotFoundException('Cita no encontrada');
    }

    const terminalStatuses = ['COMPLETED', 'CANCELLED_PATIENT', 'CANCELLED_DOCTOR', 'NO_SHOW'];
    if (terminalStatuses.includes(appointment.status)) {
      throw new BadRequestException(
        `No se puede cancelar una cita con estado ${appointment.status}`,
      );
    }

    const updated = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'CANCELLED_PATIENT' },
    });

    return {
      data: {
        id: updated.id,
        status: updated.status,
      },
      message: 'Cita cancelada exitosamente',
    };
  }

  async getAppointmentsByPatient(patientId: string) {
    const appointments = await this.prisma.appointment.findMany({
      where: { patientId },
      orderBy: { date: 'desc' },
      include: {
        tenant: {
          select: { name: true, slug: true },
        },
      },
    });

    return {
      data: { appointments },
      message: 'Citas del paciente',
    };
  }

  // ============= SMART REMINDERS - Consultory Tracking =============

  /**
   * Mark patient ENTERED consultory (start consultation)
   */
  async markEnteredConsultory(appointmentId: string, tenantId: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, tenantId },
    });

    if (!appointment) {
      throw new NotFoundException('Cita no encontrada');
    }

    if (appointment.status !== 'ARRIVED') {
      throw new BadRequestException(
        'Paciente debe estar ARRIVED (en sala de espera)',
      );
    }

    const now = new Date();

    const updated = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'IN_PROGRESS',
        enteredConsultoryAt: now,
        startedAt: now,
      },
      include: {
        patient: { select: { id: true, name: true, phone: true } },
      },
    });

    return {
      data: {
        id: updated.id,
        status: updated.status,
        enteredConsultoryAt: updated.enteredConsultoryAt,
      },
      message: 'Paciente entra a consultorio',
    };
  }

  /**
   * Mark patient LEFT consultory (end consultation)
   * Automatically records consultation duration metrics
   */
  async markLeftConsultory(
    appointmentId: string,
    tenantId: string,
    smartRemindersService?: any,
  ) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, tenantId },
      include: {
        patient: { select: { id: true, name: true, phone: true } },
        doctor: { select: { id: true, name: true } },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Cita no encontrada');
    }

    if (!appointment.enteredConsultoryAt) {
      throw new BadRequestException(
        'Paciente no ha entrado al consultorio aún',
      );
    }

    if (appointment.leftConsultoryAt) {
      throw new BadRequestException('Paciente ya salió del consultorio');
    }

    const now = new Date();

    // Update appointment
    const updated = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'COMPLETED',
        leftConsultoryAt: now,
        completedAt: now,
      },
      include: {
        patient: { select: { id: true, name: true, phone: true } },
      },
    });

    // Record consultation duration metrics (if SmartRemindersService is injected)
    if (smartRemindersService && appointment.doctorId) {
      try {
        await smartRemindersService.recordConsultationDuration(
          appointmentId,
          appointment.doctorId,
          tenantId,
        );
      } catch (error) {
        // Log but don't fail if metrics recording fails
        console.error('Failed to record consultation metrics:', error);
      }
    }

    return {
      data: {
        id: updated.id,
        status: updated.status,
        leftConsultoryAt: updated.leftConsultoryAt,
        completedAt: updated.completedAt,
      },
      message: 'Consulta finalizada',
    };
  }

  // --- Private helpers ---

  private async isSlotValid(tx: any, tenantId: string, date: Date, startTime: string, schedule: any): Promise<boolean> {
    // Check override
    const override = await tx.scheduleOverride.findUnique({
      where: { tenantId_date: { tenantId, date } },
    });

    if (override?.isBlocked) return false;

    const schedStartTime = override?.startTime ?? schedule.startTime;
    const schedEndTime = override?.endTime ?? schedule.endTime;
    const slotMinutes = this.timeToMinutes(startTime);
    const startMinutes = this.timeToMinutes(schedStartTime);
    const endMinutes = this.timeToMinutes(schedEndTime);

    if (slotMinutes < startMinutes || slotMinutes + schedule.slotDurationMin > endMinutes) {
      return false;
    }

    // Check break
    if (schedule.breakStart && schedule.breakEnd) {
      const breakStartMin = this.timeToMinutes(schedule.breakStart);
      const breakEndMin = this.timeToMinutes(schedule.breakEnd);
      if (slotMinutes >= breakStartMin && slotMinutes < breakEndMin) {
        return false;
      }
    }

    // Check if slot is in the past (for today)
    const drNow = new Date(Date.now() - 4 * 60 * 60 * 1000);
    const todayStr = drNow.toISOString().slice(0, 10);
    const dateStr =
      date.getUTCFullYear() +
      '-' +
      String(date.getUTCMonth() + 1).padStart(2, '0') +
      '-' +
      String(date.getUTCDate()).padStart(2, '0');

    if (dateStr === todayStr) {
      const nowMinutes = drNow.getUTCHours() * 60 + drNow.getUTCMinutes();
      if (slotMinutes <= nowMinutes) return false;
    }

    return true;
  }

  private getTodayDR(): Date {
    // Medianoche UTC del día de hoy en RD: estable sin importar la TZ del servidor.
    return todayRDDate();
  }

  private getCurrentTimeDR(): string {
    return currentTimeRDString();
  }

  private timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  private minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60).toString().padStart(2, '0');
    const m = (minutes % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  }
}
