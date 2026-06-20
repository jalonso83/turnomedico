import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UpdateScheduleDto, DayScheduleDto } from './dto/update-schedule.dto';
import { CreateOverrideDto } from './dto/create-override.dto';

@Injectable()
export class SchedulesService {
  constructor(private readonly prisma: PrismaService) {}

  async getWeeklySchedule(tenantId: string) {
    const schedules = await this.prisma.schedule.findMany({
      where: { tenantId },
      orderBy: { dayOfWeek: 'asc' },
    });

    // Build a full 7-day view (0-6), marking unconfigured days
    const fullWeek = Array.from({ length: 7 }, (_, i) => {
      const existing = schedules.find((s) => s.dayOfWeek === i);
      if (existing) {
        return { ...existing, configured: true };
      }
      return {
        dayOfWeek: i,
        isActive: false,
        startTime: null,
        endTime: null,
        slotDurationMin: 30,
        breakStart: null,
        breakEnd: null,
        configured: false,
      };
    });

    return fullWeek;
  }

  async updateWeeklySchedule(tenantId: string, dto: UpdateScheduleDto) {
    // Validate each active day
    for (const day of dto.schedules) {
      if (day.isActive) {
        this.validateTimeRange(day);
      }
    }

    // Upsert each day within a transaction
    const results = await this.prisma.$transaction(
      dto.schedules.map((day) =>
        this.prisma.schedule.upsert({
          where: {
            tenantId_dayOfWeek: {
              tenantId,
              dayOfWeek: day.dayOfWeek,
            },
          },
          create: {
            tenantId,
            dayOfWeek: day.dayOfWeek,
            isActive: day.isActive,
            startTime: day.isActive ? day.startTime : '00:00',
            endTime: day.isActive ? day.endTime : '00:00',
            slotDurationMin: day.isActive ? day.slotDurationMin : 30,
            breakStart: day.breakStart ?? null,
            breakEnd: day.breakEnd ?? null,
            maxAppointments: day.isActive ? day.maxAppointments ?? null : null,
          },
          update: {
            isActive: day.isActive,
            startTime: day.isActive ? day.startTime : '00:00',
            endTime: day.isActive ? day.endTime : '00:00',
            slotDurationMin: day.isActive ? day.slotDurationMin : 30,
            breakStart: day.breakStart ?? null,
            breakEnd: day.breakEnd ?? null,
            maxAppointments: day.isActive ? day.maxAppointments ?? null : null,
          },
        }),
      ),
    );

    return results;
  }

  async getOverrides(tenantId: string, from?: string, to?: string) {
    // Defaults: today → today + 6 months
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const sixMonthsAhead = new Date(today);
    sixMonthsAhead.setUTCMonth(sixMonthsAhead.getUTCMonth() + 6);

    const fromDate = from ? new Date(from) : today;
    const toDate = to ? new Date(to) : sixMonthsAhead;

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      throw new BadRequestException('Fechas inválidas. Use formato YYYY-MM-DD');
    }

    return this.prisma.scheduleOverride.findMany({
      where: {
        tenantId,
        date: {
          gte: fromDate,
          lte: toDate,
        },
      },
      orderBy: { date: 'asc' },
    });
  }

  async createOverride(tenantId: string, dto: CreateOverrideDto) {
    const date = new Date(dto.date);
    if (isNaN(date.getTime())) {
      throw new BadRequestException('Fecha inválida. Use formato YYYY-MM-DD');
    }

    const isBlocked = dto.isBlocked ?? true;

    // If not blocked and has special hours, validate time range
    if (!isBlocked && dto.startTime && dto.endTime) {
      if (this.timeToMinutes(dto.endTime) <= this.timeToMinutes(dto.startTime)) {
        throw new BadRequestException('endTime debe ser mayor que startTime');
      }
    }

    return this.prisma.scheduleOverride.upsert({
      where: {
        tenantId_date: {
          tenantId,
          date,
        },
      },
      create: {
        tenantId,
        date,
        isBlocked,
        reason: dto.reason ?? null,
        startTime: dto.startTime ?? null,
        endTime: dto.endTime ?? null,
      },
      update: {
        isBlocked,
        reason: dto.reason ?? null,
        startTime: dto.startTime ?? null,
        endTime: dto.endTime ?? null,
      },
    });
  }

  /** Bloquea todos los días dentro de [from, to] (inclusivo) en una sola operación. */
  async blockRange(tenantId: string, from: string, to: string, reason?: string) {
    const start = new Date(from);
    const end = new Date(to);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Fechas inválidas. Use formato YYYY-MM-DD');
    }
    if (end.getTime() < start.getTime()) {
      throw new BadRequestException(
        'La fecha final debe ser igual o posterior a la inicial',
      );
    }

    const MS_DAY = 24 * 60 * 60 * 1000;
    const days = Math.floor((end.getTime() - start.getTime()) / MS_DAY) + 1;
    if (days > 366) {
      throw new BadRequestException('El rango no puede exceder 366 días');
    }

    // Trabajamos en UTC (las fechas vienen como YYYY-MM-DD = medianoche UTC).
    const ops = Array.from({ length: days }, (_, i) => {
      const date = new Date(start.getTime() + i * MS_DAY);
      return this.prisma.scheduleOverride.upsert({
        where: { tenantId_date: { tenantId, date } },
        create: { tenantId, date, isBlocked: true, reason: reason ?? null },
        update: { isBlocked: true, reason: reason ?? null },
      });
    });

    return this.prisma.$transaction(ops);
  }

  async deleteOverride(tenantId: string, overrideId: string) {
    const override = await this.prisma.scheduleOverride.findFirst({
      where: { id: overrideId, tenantId },
    });

    if (!override) {
      throw new NotFoundException('Override no encontrado');
    }

    await this.prisma.scheduleOverride.delete({
      where: { id: overrideId },
    });

    return { deleted: true };
  }

  async getAvailableSlots(tenantId: string, date: Date) {
    const dayOfWeek = date.getUTCDay();

    // Check for override first
    const override = await this.prisma.scheduleOverride.findUnique({
      where: {
        tenantId_date: { tenantId, date },
      },
    });

    if (override?.isBlocked) {
      return [];
    }

    // Get the schedule for this day
    const schedule = await this.prisma.schedule.findUnique({
      where: {
        tenantId_dayOfWeek: { tenantId, dayOfWeek },
      },
    });

    if (!schedule || !schedule.isActive) {
      return [];
    }

    // Use override hours if available, otherwise use regular schedule
    const startTime = override?.startTime ?? schedule.startTime;
    const endTime = override?.endTime ?? schedule.endTime;
    const slotDuration = schedule.slotDurationMin;

    // Generate time slots
    const slots: string[] = [];
    let currentMinutes = this.timeToMinutes(startTime);
    const endMinutes = this.timeToMinutes(endTime);
    const breakStartMin = schedule.breakStart
      ? this.timeToMinutes(schedule.breakStart)
      : null;
    const breakEndMin = schedule.breakEnd
      ? this.timeToMinutes(schedule.breakEnd)
      : null;

    while (currentMinutes + slotDuration <= endMinutes) {
      // Skip break period
      if (
        breakStartMin !== null &&
        breakEndMin !== null &&
        currentMinutes >= breakStartMin &&
        currentMinutes < breakEndMin
      ) {
        currentMinutes = breakEndMin;
        continue;
      }

      slots.push(this.minutesToTime(currentMinutes));
      currentMinutes += slotDuration;
    }

    // Subtract already-booked appointments
    const booked = await this.prisma.appointment.findMany({
      where: {
        tenantId,
        date,
        status: {
          notIn: ['CANCELLED_PATIENT', 'CANCELLED_DOCTOR'],
        },
      },
      select: { startTime: true },
    });

    const bookedTimes = new Set(booked.map((a) => a.startTime));
    return slots.filter((slot) => !bookedTimes.has(slot));
  }

  // --- Private helpers ---

  private validateTimeRange(day: DayScheduleDto) {
    if (this.timeToMinutes(day.endTime) <= this.timeToMinutes(day.startTime)) {
      throw new BadRequestException(
        `Día ${day.dayOfWeek}: endTime debe ser mayor que startTime`,
      );
    }

    if (day.breakStart && day.breakEnd) {
      if (
        this.timeToMinutes(day.breakEnd) <= this.timeToMinutes(day.breakStart)
      ) {
        throw new BadRequestException(
          `Día ${day.dayOfWeek}: breakEnd debe ser mayor que breakStart`,
        );
      }
    }
  }

  private timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  private minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60)
      .toString()
      .padStart(2, '0');
    const m = (minutes % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  }
}
