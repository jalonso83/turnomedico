import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { todayRDDate } from '../../common/utils/timezone.util';

@Injectable()
export class QueueService {
  constructor(private readonly prisma: PrismaService) {}

  async getDisplayData(displayToken: string) {
    // Find tenant by display token
    const config = await this.prisma.officeConfig.findUnique({
      where: { displayToken },
      include: {
        tenant: {
          include: {
            users: {
              where: { role: 'DOCTOR' },
              select: { name: true },
              take: 1,
            },
            doctorProfile: {
              select: { specialty: true },
            },
          },
        },
      },
    });

    if (!config) {
      throw new NotFoundException('Pantalla no encontrada. Token inválido.');
    }

    const tenantId = config.tenantId;
    // Día de hoy en RD anclado a medianoche UTC (coincide con cómo se guardan las citas).
    const today = todayRDDate();

    // Get today's appointments
    const appointments = await this.prisma.appointment.findMany({
      where: {
        tenantId,
        date: today,
        status: {
          notIn: ['CANCELLED_PATIENT', 'CANCELLED_DOCTOR'],
        },
      },
      include: {
        patient: {
          select: { name: true },
        },
      },
      orderBy: [
        { queuePosition: 'asc' },
        { startTime: 'asc' },
      ],
    });

    // Build queue state
    const currentPatient = appointments.find(
      (a) => a.status === 'IN_PROGRESS',
    );

    const waitingQueue = appointments
      .filter((a) => a.status === 'ARRIVED')
      .map((a, idx) => ({
        position: a.queuePosition || idx + 1,
        initials: getInitials(a.patient.name),
        status: 'waiting' as const,
        startTime: a.startTime,
      }));

    const upcomingQueue = appointments
      .filter((a) => a.status === 'CONFIRMED' || a.status === 'PENDING')
      .map((a) => ({
        position: 0,
        initials: getInitials(a.patient.name),
        status: 'upcoming' as const,
        startTime: a.startTime,
      }));

    // Stats
    const completed = appointments.filter((a) => a.status === 'COMPLETED').length;
    const noShows = appointments.filter((a) => a.status === 'NO_SHOW').length;
    const total = appointments.length;
    const waiting = waitingQueue.length;

    // Estimate wait time (average 20 min per patient ahead)
    const avgWaitMinutes = waiting > 0 ? waiting * 20 : 0;

    return {
      data: {
        config: {
          displayName: config.displayName,
          welcomeMessage: config.welcomeMessage,
          theme: config.theme,
          primaryColor: config.primaryColor,
          logoUrl: config.logoUrl,
        },
        doctorName: config.tenant.users[0]?.name ?? config.displayName,
        specialty: config.tenant.doctorProfile?.specialty ?? '',
        currentPatient: currentPatient
          ? {
              initials: getInitials(currentPatient.patient.name),
              status: 'En consulta',
              queuePosition: currentPatient.queuePosition || 1,
            }
          : null,
        waitingQueue,
        upcomingQueue,
        stats: {
          total,
          completed,
          waiting,
          noShows,
          remaining: total - completed - noShows,
          avgWaitMinutes,
        },
      },
      message: 'Datos de pantalla obtenidos',
    };
  }
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return parts[0]?.substring(0, 2).toUpperCase() || '??';
}
