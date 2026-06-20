import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
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
    const today = this.getTodayDR();

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

      // Within same priority group, sort by queuePosition then startTime
      if (a.status === 'ARRIVED' || a.status === 'IN_PROGRESS') {
        return (a.queuePosition ?? 999) - (b.queuePosition ?? 999);
      }
      // queuePosition es el orden natural en el nuevo modelo; startTime es fallback legacy
      const qa = a.queuePosition ?? 999;
      const qb = b.queuePosition ?? 999;
      if (qa !== qb) return qa - qb;
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
        // Assign next queue position for today
        const maxQueue = await this.prisma.appointment.aggregate({
          where: {
            tenantId,
            date: appointment.date,
            queuePosition: { not: null },
          },
          _max: { queuePosition: true },
        });
        updateData.queuePosition = (maxQueue._max.queuePosition ?? 0) + 1;
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

      // Validar tope de cupos
      if (schedule.maxAppointments != null && activeAppointments.length >= schedule.maxAppointments) {
        throw new ConflictException('Ya no quedan cupos para ese día');
      }

      // Próximo número de turno (1-based, secuencial por día)
      const maxQueue = activeAppointments.reduce(
        (max, a) => (a.queuePosition != null && a.queuePosition > max ? a.queuePosition : max),
        0,
      );
      const queuePosition = maxQueue + 1;

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

      const appointment = await tx.appointment.create({
        data: {
          tenantId,
          patientId: patient.id,
          date,
          startTime,
          endTime: null,
          queuePosition,
          status: 'CONFIRMED',
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
        queuePosition: result.appointment.queuePosition,
        doctorStartTime: override?.startTime ?? schedule.startTime,
        status: result.appointment.status,
        reason: result.appointment.reason,
        doctorName: tenant.users[0]?.name ?? tenant.name,
        consultorioName: tenant.doctorProfile.consultorioName,
      },
      message: 'Turno reservado exitosamente',
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
