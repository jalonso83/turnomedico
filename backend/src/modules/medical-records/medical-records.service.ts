import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UpsertConsultationNoteDto } from './dto/consultation-note.dto';
import { UpsertVitalSignsDto } from './dto/vital-signs.dto';
import { UpsertPrescriptionDto } from './dto/prescription.dto';
import type { Prisma } from '@prisma/client';

@Injectable()
export class MedicalRecordsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertAppointmentInTenant(appointmentId: string, tenantId: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, tenantId },
      select: { id: true },
    });
    if (!appointment) {
      throw new NotFoundException('Cita no encontrada');
    }
  }

  async getFullRecord(appointmentId: string, tenantId: string) {
    await this.assertAppointmentInTenant(appointmentId, tenantId);

    const [appointment, note, vitals, prescription] = await Promise.all([
      this.prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              phone: true,
              cedula: true,
              dateOfBirth: true,
              gender: true,
            },
          },
        },
      }),
      this.prisma.consultationNote.findUnique({ where: { appointmentId } }),
      this.prisma.vitalSigns.findUnique({ where: { appointmentId } }),
      this.prisma.prescription.findUnique({ where: { appointmentId } }),
    ]);

    // tenantPatient para antecedentes
    const tenantPatient = appointment?.patientId
      ? await this.prisma.tenantPatient.findUnique({
          where: {
            tenantId_patientId: { tenantId, patientId: appointment.patientId },
          },
          select: {
            bloodType: true,
            allergies: true,
            chronicConditions: true,
            currentMedications: true,
            surgeries: true,
            familyHistory: true,
            insurance: true,
            isVip: true,
            notes: true,
          },
        })
      : null;

    return {
      data: {
        appointment: {
          id: appointment!.id,
          date: appointment!.date,
          status: appointment!.status,
          reason: appointment!.reason,
          queuePosition: appointment!.queuePosition,
          patient: appointment!.patient,
        },
        antecedentes: tenantPatient,
        consultationNote: note,
        vitalSigns: vitals,
        prescription,
      },
      message: 'Expediente de la cita',
    };
  }

  async upsertConsultationNote(
    appointmentId: string,
    tenantId: string,
    dto: UpsertConsultationNoteDto,
  ) {
    await this.assertAppointmentInTenant(appointmentId, tenantId);

    const note = await this.prisma.consultationNote.upsert({
      where: { appointmentId },
      create: {
        appointmentId,
        tenantId,
        ...dto,
      },
      update: { ...dto },
    });

    return { data: note, message: 'Nota de consulta guardada' };
  }

  async upsertVitalSigns(
    appointmentId: string,
    tenantId: string,
    dto: UpsertVitalSignsDto,
  ) {
    await this.assertAppointmentInTenant(appointmentId, tenantId);

    const vitals = await this.prisma.vitalSigns.upsert({
      where: { appointmentId },
      create: {
        appointmentId,
        tenantId,
        ...dto,
      },
      update: { ...dto },
    });

    return { data: vitals, message: 'Signos vitales guardados' };
  }

  async upsertPrescription(
    appointmentId: string,
    tenantId: string,
    dto: UpsertPrescriptionDto,
  ) {
    await this.assertAppointmentInTenant(appointmentId, tenantId);

    const prescription = await this.prisma.prescription.upsert({
      where: { appointmentId },
      create: {
        appointmentId,
        tenantId,
        items: (dto.items ?? []) as unknown as Prisma.InputJsonValue,
        notes: dto.notes ?? null,
      },
      update: {
        items: (dto.items ?? []) as unknown as Prisma.InputJsonValue,
        notes: dto.notes ?? null,
      },
    });

    return { data: prescription, message: 'Receta guardada' };
  }
}
