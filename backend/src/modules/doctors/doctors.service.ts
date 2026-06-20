import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { dateOnlyUTC } from '../../common/utils/timezone.util';

@Injectable()
export class DoctorsService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query?: string, specialty?: string, city?: string, limit = 20, offset = 0) {
    const where: any = {
      isPublicVisible: true,
      agendaActive: true,
    };

    if (specialty) {
      where.specialty = { contains: specialty, mode: 'insensitive' };
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (query) {
      where.OR = [
        { specialty: { contains: query, mode: 'insensitive' } },
        { consultorioName: { contains: query, mode: 'insensitive' } },
        {
          tenant: {
            users: {
              some: {
                role: 'DOCTOR',
                name: { contains: query, mode: 'insensitive' },
              },
            },
          },
        },
      ];
    }

    const [profiles, total] = await Promise.all([
      this.prisma.doctorProfile.findMany({
        where,
        include: {
          tenant: {
            include: {
              users: {
                where: { role: 'DOCTOR' },
                select: { name: true },
                take: 1,
              },
            },
          },
          insurances: {
            include: {
              insurance: {
                select: { id: true, slug: true, shortName: true, name: true },
              },
            },
          },
        },
        skip: offset,
        take: limit,
        orderBy: { ratingAvg: 'desc' },
      }),
      this.prisma.doctorProfile.count({ where }),
    ]);

    const doctors = profiles.map((p) => ({
      id: p.id,
      name: p.tenant.users[0]?.name ?? p.tenant.name,
      specialty: p.specialty,
      city: p.city,
      consultorioName: p.consultorioName,
      ratingAvg: p.ratingAvg,
      totalReviews: p.totalReviews,
      slug: p.tenant.slug,
      consultationFee: p.consultationFee,
      photoUrl: p.photoUrl,
      insurances: p.insurances.map((di) => ({
        id: di.insurance.id,
        slug: di.insurance.slug,
        shortName: di.insurance.shortName ?? di.insurance.name,
      })),
    }));

    return {
      data: { doctors, total, limit, offset },
      message: 'Doctores encontrados',
    };
  }

  async getPublicProfile(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      include: {
        doctorProfile: {
          include: {
            insurances: {
              include: {
                insurance: {
                  select: { id: true, slug: true, name: true, shortName: true, logoUrl: true },
                },
              },
            },
          },
        },
        users: {
          where: { role: 'DOCTOR' },
          select: { name: true, email: true },
          take: 1,
        },
      },
    });

    if (!tenant || !tenant.doctorProfile) {
      throw new NotFoundException('Doctor no encontrado');
    }

    const profile = tenant.doctorProfile;

    if (!profile.isPublicVisible) {
      throw new NotFoundException('Doctor no encontrado');
    }

    const doctorUser = tenant.users[0];

    return {
      data: {
        name: doctorUser?.name ?? tenant.name,
        slug: tenant.slug,
        specialty: profile.specialty,
        subspecialty: profile.subspecialty,
        bio: profile.bio,
        photoUrl: profile.photoUrl,
        consultorioName: profile.consultorioName,
        address: profile.address,
        floor: profile.floor,
        reference: profile.reference,
        city: profile.city,
        sector: profile.sector,
        latitude: profile.latitude,
        longitude: profile.longitude,
        consultationFee: profile.consultationFee,
        currency: profile.currency,
        ratingAvg: profile.ratingAvg,
        totalReviews: profile.totalReviews,
        insurances: profile.insurances.map((di) => di.insurance),
        languages: profile.languages,
        phone: profile.phone,
        agendaActive: profile.agendaActive,
      },
      message: 'Perfil del doctor',
    };
  }

  async getAvailableSlots(slug: string, dateStr: string) {
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      throw new BadRequestException('Formato de fecha inválido. Use YYYY-MM-DD');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!tenant) {
      throw new NotFoundException('Doctor no encontrado');
    }

    const date = dateOnlyUTC(dateStr);
    const dayOfWeek = date.getUTCDay();

    // Check for override
    const override = await this.prisma.scheduleOverride.findUnique({
      where: {
        tenantId_date: { tenantId: tenant.id, date },
      },
    });

    if (override?.isBlocked) {
      return { data: { slots: [], date: dateStr }, message: 'Día bloqueado' };
    }

    // Get schedule for this day of week
    const schedule = await this.prisma.schedule.findUnique({
      where: {
        tenantId_dayOfWeek: { tenantId: tenant.id, dayOfWeek },
      },
    });

    if (!schedule || !schedule.isActive) {
      return { data: { slots: [], date: dateStr }, message: 'Sin horario configurado para este día' };
    }

    // Use override hours if available
    const startTime = override?.startTime ?? schedule.startTime;
    const endTime = override?.endTime ?? schedule.endTime;
    const slotDuration = schedule.slotDurationMin;

    // Generate all possible slots
    const slots: string[] = [];
    let currentMinutes = this.timeToMinutes(startTime);
    const endMinutes = this.timeToMinutes(endTime);
    const breakStartMin = schedule.breakStart ? this.timeToMinutes(schedule.breakStart) : null;
    const breakEndMin = schedule.breakEnd ? this.timeToMinutes(schedule.breakEnd) : null;

    while (currentMinutes + slotDuration <= endMinutes) {
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

    // Get existing appointments (not cancelled) for this date
    const booked = await this.prisma.appointment.findMany({
      where: {
        tenantId: tenant.id,
        date,
        status: { notIn: ['CANCELLED_PATIENT', 'CANCELLED_DOCTOR'] },
      },
      select: { startTime: true },
    });

    const bookedTimes = new Set(booked.map((a) => a.startTime));
    let available = slots.filter((slot) => !bookedTimes.has(slot));

    // If date is today, filter out past slots (Dominican Republic UTC-4)
    const now = new Date();
    const drNow = new Date(now.getTime() - 4 * 60 * 60 * 1000);
    const todayStr =
      drNow.getUTCFullYear() +
      '-' +
      String(drNow.getUTCMonth() + 1).padStart(2, '0') +
      '-' +
      String(drNow.getUTCDate()).padStart(2, '0');

    if (dateStr === todayStr) {
      const nowMinutes = drNow.getUTCHours() * 60 + drNow.getUTCMinutes();
      available = available.filter((slot) => this.timeToMinutes(slot) > nowMinutes);
    }

    return {
      data: { slots: available, date: dateStr },
      message: 'Horarios disponibles',
    };
  }

  async getReviews(slug: string, page = 1, limit = 10) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!tenant) {
      throw new NotFoundException('Doctor no encontrado');
    }

    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { tenantId: tenant.id, isVisible: true },
        include: {
          patient: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.review.count({
        where: { tenantId: tenant.id, isVisible: true },
      }),
    ]);

    const data = reviews.map((r) => {
      const nameParts = r.patient.name.trim().split(/\s+/);
      const displayName =
        nameParts.length > 1
          ? `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.`
          : nameParts[0];

      return {
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        patientName: displayName,
        createdAt: r.createdAt,
      };
    });

    return {
      data: { reviews: data, total, page, limit },
      message: 'Reseñas obtenidas',
    };
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
