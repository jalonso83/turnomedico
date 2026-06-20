import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import axios from 'axios';

interface TravelTimeResponse {
  rows: Array<{
    elements: Array<{
      duration: { value: number };
      distance: { value: number };
    }>;
  }>;
}

@Injectable()
export class SmartRemindersService {
  private readonly logger = new Logger(SmartRemindersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * 1. OBTENER PROMEDIO DE DURACIÓN DEL DOCTOR
   *    = Promedio de tiempo que ESTE doctor tarda con TODOS sus pacientes
   */
  async getAverageDoctorConsultoryTime(
    doctorId: string,
    tenantId: string,
  ): Promise<number> {
    const metrics = await this.prisma.doctorConsultationMetric.findMany({
      where: {
        doctorId,
        tenantId,
      },
      orderBy: { createdAt: 'desc' },
      take: 20, // Últimas 20 consultas
    });

    if (metrics.length === 0) {
      return 25; // Default 25 min si sin historial
    }

    const totalMinutes = metrics.reduce(
      (sum, m) => sum + m.consultoryDurationMin,
      0,
    );
    const average = Math.round(totalMinutes / metrics.length);

    this.logger.debug(
      `Doctor ${doctorId} average consultory time: ${average}min from ${metrics.length} consultations`,
    );
    return average;
  }

  /**
   * 2. OBTENER TIEMPO DE VIAJE (Google Maps Distance Matrix API)
   */
  async getTravelTime(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
  ): Promise<number> {
    try {
      const response = await axios.get<TravelTimeResponse>(
        'https://maps.googleapis.com/maps/api/distancematrix/json',
        {
          params: {
            origins: `${originLat},${originLng}`,
            destinations: `${destLat},${destLng}`,
            key: process.env.GOOGLE_MAPS_API_KEY,
            mode: 'driving',
            departure_time: 'now', // Real-time traffic
          },
        },
      );

      const durationSeconds =
        response.data.rows?.[0]?.elements?.[0]?.duration?.value ?? 0;
      const durationMinutes = Math.ceil(durationSeconds / 60);

      this.logger.debug(`Travel time calculated: ${durationMinutes} minutes`);
      return durationMinutes;
    } catch (error) {
      this.logger.error('Google Maps API error:', error);
      return 45; // Default si falla
    }
  }

  /**
   * 3. CREAR SMART REMINDER (se llama al crear la cita)
   */
  async createSmartReminder(appointmentId: string, tenantId: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, tenantId },
      include: {
        patient: { select: { id: true, phone: true, name: true } },
        doctor: { select: { id: true, name: true } },
      },
    });

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    if (!appointment.doctorId) {
      throw new BadRequestException('Appointment must have a doctor assigned');
    }

    // Obtener ubicación clínica del perfil del doctor
    const doctorProfile = await this.prisma.doctorProfile.findUnique({
      where: { tenantId },
    });

    // Ubicación clínica (default a Santo Domingo Este)
    const clinicLat = doctorProfile?.latitude ?? 18.486;
    const clinicLng = doctorProfile?.longitude ?? -69.915;

    // TODO: Obtener ubicación ACTUAL del paciente
    // En producción: se captura cuando paciente abre la app (geolocation API)
    // Por ahora: default a Santo Domingo Este
    const patientLat = 18.487;
    const patientLng = -69.914;

    // ✅ Cálculo 1: Promedio del DOCTOR (no del paciente)
    const avgDoctorConsultoryMin = await this.getAverageDoctorConsultoryTime(
      appointment.doctorId,
      tenantId,
    );

    // ✅ Cálculo 2: Colchón de 25%
    const bufferMin = Math.ceil(avgDoctorConsultoryMin * 0.25);

    // ✅ Cálculo 3: Tiempo de viaje
    const travelTimeMin = await this.getTravelTime(
      patientLat,
      patientLng,
      clinicLat,
      clinicLng,
    );

    // ✅ Cálculo 4: Total necesario
    const totalTimeNeededMin =
      avgDoctorConsultoryMin + bufferMin + travelTimeMin;

    // ✅ Convertir hora de cita a DateTime (fallback a "09:00" si no hay startTime en modelo "por turno")
    const [hours, minutes] = (appointment.startTime ?? '09:00').split(':').map(Number);
    const appointmentDateTime = new Date(appointment.date);
    appointmentDateTime.setHours(hours, minutes, 0, 0);

    // ✅ Hora en que debe SALIR
    const suggestedDepartureTime = new Date(
      appointmentDateTime.getTime() - totalTimeNeededMin * 60 * 1000,
    );

    // Crear reminder en BD
    const reminder = await this.prisma.smartReminder.create({
      data: {
        appointmentId,
        patientId: appointment.patientId,
        tenantId,
        clinicLat,
        clinicLng,
        patientLat,
        patientLng,
        averageDoctorConsultoryMin: avgDoctorConsultoryMin,
        bufferMin,
        travelTimeMin,
        totalTimeNeededMin,
        suggestedDepartureTime,
      },
    });

    // Programar AMBOS avisos
    this.scheduleReminderNotifications(
      reminder.id,
      appointmentDateTime,
      suggestedDepartureTime,
    );

    this.logger.log(
      `Smart Reminder created for appointment ${appointmentId}: depart at ${suggestedDepartureTime.toLocaleTimeString('es-DO')}`,
    );

    return reminder;
  }

  /**
   * 4. PROGRAMAR NOTIFICACIONES (2 avisos)
   *    - Aviso 1: Mañana de la cita (7:00 AM)
   *    - Aviso 2: 1 hora antes de salir (TÁCTICO)
   */
  private scheduleReminderNotifications(
    reminderId: string,
    appointmentTime: Date,
    suggestedDepartureTime: Date,
  ) {
    const now = new Date();

    // AVISO 1: Mañana de la cita a las 7:00 AM
    const morningOfAppointment = new Date(appointmentTime);
    morningOfAppointment.setHours(7, 0, 0, 0);

    const delayToMorning = morningOfAppointment.getTime() - now.getTime();

    if (delayToMorning > 0) {
      setTimeout(() => this.sendMorningReminder(reminderId), delayToMorning);
      this.logger.log(
        `Morning reminder scheduled for ${reminderId} at ${morningOfAppointment.toISOString()}`,
      );
    } else if (now.toDateString() === appointmentTime.toDateString()) {
      // Si es hoy, enviar aviso de mañana AHORA
      this.sendMorningReminder(reminderId);
    }

    // AVISO 2: 1 hora antes de SALIR (más importante)
    const tacticalReminderTime = new Date(
      suggestedDepartureTime.getTime() - 60 * 60 * 1000, // 1h antes de salir
    );

    const delayToTactical = tacticalReminderTime.getTime() - now.getTime();

    if (delayToTactical > 0) {
      setTimeout(() => this.sendSmartReminder(reminderId), delayToTactical);
      this.logger.log(
        `Tactical reminder scheduled for ${reminderId} at ${tacticalReminderTime.toISOString()}`,
      );
    } else if (delayToTactical <= 0 && now < suggestedDepartureTime) {
      // Si la hora de aviso táctico ya pasó pero aún no es la hora de salir, enviar AHORA
      this.sendSmartReminder(reminderId);
    }
  }

  /**
   * 5A. AVISO DE MAÑANA (7am del día de cita - informativo)
   *     "Tu cita es hoy a las 14:30 con Dr. Rodríguez"
   */
  async sendMorningReminder(reminderId: string) {
    const reminder = await this.prisma.smartReminder.findUnique({
      where: { id: reminderId },
      include: {
        appointment: {
          include: {
            patient: { select: { name: true, phone: true } },
            doctor: { select: { name: true } },
          },
        },
      },
    });

    if (!reminder) return;

    const appointmentTime = reminder.appointment.startTime;
    const doctorName = reminder.appointment.doctor?.name || 'Doctor';
    const patientFirstName = reminder.appointment.patient.name.split(' ')[0];

    const message = `Hola ${patientFirstName},

📅 Tienes cita HOY con Dr(a). ${doctorName}
🕐 Hora: ${appointmentTime}

Recibirás un aviso más tarde cuando debas salir.

¡Nos vemos!`;

    try {
      await this.notificationsService.notify({
        recipientPhone: reminder.appointment.patient.phone,
        title: `Recordatorio: Cita HOY a las ${appointmentTime}`,
        message: message,
        data: {
          reminderId,
          appointmentId: reminder.appointmentId,
          type: 'MORNING_REMINDER',
        },
      });

      this.logger.log(
        `Morning reminder sent to ${reminder.appointment.patient.name}`,
      );
    } catch (error) {
      this.logger.error(`Failed to send morning reminder ${reminderId}:`, error);
    }
  }

  /**
   * 5B. AVISO TÁCTICO (1h antes de salir - URGENTE)
   *     "⚠️ DEBES SALIR EN 1 HORA A LAS 13:30"
   */
  async sendSmartReminder(reminderId: string) {
    const reminder = await this.prisma.smartReminder.findUnique({
      where: { id: reminderId },
      include: {
        appointment: {
          include: {
            patient: { select: { name: true, phone: true } },
            doctor: { select: { name: true } },
          },
        },
      },
    });

    if (!reminder || reminder.reminderSentAt) {
      return;
    }

    const departureTime = reminder.suggestedDepartureTime.toLocaleTimeString(
      'es-DO',
      { hour: '2-digit', minute: '2-digit' },
    );

    const appointmentTime = reminder.appointment.startTime;
    const doctorName = reminder.appointment.doctor?.name || 'Doctor';
    const patientFirstName = reminder.appointment.patient.name.split(' ')[0];

    // Mensaje URGENTE y táctico
    const message = `⚠️ ${patientFirstName},

¡ES HORA DE PREPARARSE!

Tu cita con Dr(a). ${doctorName} es a las ${appointmentTime}

🚗 DEBES SALIR AHORA A LAS ${departureTime}
(En 1 hora)

Viaje estimado: ${reminder.travelTimeMin} minutos
Atraso por si acaso: ${reminder.bufferMin} minutos

¡Sin demoras! 🏥`;

    try {
      // Enviar SMS + Push (prioridad alta)
      await this.notificationsService.notify({
        recipientPhone: reminder.appointment.patient.phone,
        title: `⚠️ AHORA: Debes salir a las ${departureTime}`,
        message: message,
        data: {
          reminderId,
          appointmentId: reminder.appointmentId,
          type: 'TACTICAL_REMINDER',
          priority: 'high',
        },
      });

      // Marcar como enviado
      await this.prisma.smartReminder.update({
        where: { id: reminderId },
        data: { reminderSentAt: new Date() },
      });

      this.logger.log(
        `Tactical reminder sent to ${reminder.appointment.patient.name}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send tactical reminder ${reminderId}:`,
        error,
      );
    }
  }

  /**
   * 6. REGISTRAR DURACIÓN REAL DE CONSULTA (se llama cuando paciente sale)
   */
  async recordConsultationDuration(
    appointmentId: string,
    doctorId: string,
    tenantId: string,
  ) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (
      !appointment ||
      !appointment.enteredConsultoryAt ||
      !appointment.leftConsultoryAt
    ) {
      throw new BadRequestException(
        'Invalid appointment state for consultation duration',
      );
    }

    const consultoryDurationMin = Math.round(
      (appointment.leftConsultoryAt.getTime() -
        appointment.enteredConsultoryAt.getTime()) /
        60000,
    );

    // Guardar métrica para el DOCTOR
    const metric = await this.prisma.doctorConsultationMetric.create({
      data: {
        appointmentId,
        doctorId,
        tenantId,
        consultoryDurationMin,
      },
    });

    this.logger.log(
      `Doctor ${doctorId}: Consultation duration recorded: ${consultoryDurationMin} minutes`,
    );

    return metric;
  }

  /**
   * GET: Obtener estadísticas del doctor
   */
  async getDoctorStats(doctorId: string, tenantId: string) {
    const metrics = await this.prisma.doctorConsultationMetric.findMany({
      where: {
        doctorId,
        tenantId,
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    if (metrics.length === 0) {
      return {
        averageConsultationTime: 25,
        totalConsultations: 0,
        minConsultationTime: 0,
        maxConsultationTime: 0,
        lastConsultationTime: null,
      };
    }

    const durations = metrics.map((m) => m.consultoryDurationMin);
    const average = Math.round(
      durations.reduce((a, b) => a + b, 0) / durations.length,
    );
    const min = Math.min(...durations);
    const max = Math.max(...durations);

    return {
      averageConsultationTime: average,
      totalConsultations: metrics.length,
      minConsultationTime: min,
      maxConsultationTime: max,
      lastConsultationTime: metrics[0]?.consultoryDurationMin || null,
    };
  }
}
