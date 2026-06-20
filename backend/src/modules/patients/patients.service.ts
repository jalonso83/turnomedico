import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService) {}

  async findOrCreate(phone: string, name?: string) {
    let patient = await this.prisma.patient.findUnique({
      where: { phone },
    });

    if (!patient) {
      patient = await this.prisma.patient.create({
        data: {
          phone,
          name: name ?? 'Paciente',
        },
      });
    } else if (name && patient.name === 'Paciente') {
      patient = await this.prisma.patient.update({
        where: { id: patient.id },
        data: { name },
      });
    }

    return patient;
  }

  async findOrCreateTenantPatient(tenantId: string, patientId: string) {
    let tp = await this.prisma.tenantPatient.findUnique({
      where: {
        tenantId_patientId: { tenantId, patientId },
      },
    });

    if (!tp) {
      tp = await this.prisma.tenantPatient.create({
        data: { tenantId, patientId },
      });
    }

    return tp;
  }

  async listByTenant(tenantId: string, search?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const where: any = { tenantId };

    if (search) {
      where.patient = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
        ],
      };
    }

    const [tenantPatients, total] = await Promise.all([
      this.prisma.tenantPatient.findMany({
        where,
        include: {
          patient: {
            select: { id: true, name: true, phone: true, email: true },
          },
        },
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.tenantPatient.count({ where }),
    ]);

    // Get appointment stats for each patient
    const patientIds = tenantPatients.map((tp) => tp.patientId);

    const appointmentStats = await this.prisma.appointment.groupBy({
      by: ['patientId'],
      where: {
        tenantId,
        patientId: { in: patientIds },
      },
      _count: { id: true },
      _max: { date: true },
    });

    const statsMap = new Map(
      appointmentStats.map((s) => [
        s.patientId,
        { totalAppointments: s._count.id, lastVisit: s._max.date },
      ]),
    );

    const patients = tenantPatients.map((tp) => {
      const stats = statsMap.get(tp.patientId);
      return {
        id: tp.patient.id,
        tenantPatientId: tp.id,
        name: tp.patient.name,
        phone: tp.patient.phone,
        email: tp.patient.email,
        notes: tp.notes,
        insurance: tp.insurance,
        isVip: tp.isVip,
        totalAppointments: stats?.totalAppointments ?? 0,
        lastVisit: stats?.lastVisit ?? null,
      };
    });

    // Sort by lastVisit desc (patients with visits first)
    patients.sort((a, b) => {
      if (!a.lastVisit && !b.lastVisit) return 0;
      if (!a.lastVisit) return 1;
      if (!b.lastVisit) return -1;
      return new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime();
    });

    return {
      data: { patients, total, page, limit },
      message: 'Pacientes obtenidos',
    };
  }

  async findById(patientId: string, tenantId: string) {
    const tp = await this.prisma.tenantPatient.findUnique({
      where: {
        tenantId_patientId: { tenantId, patientId },
      },
      include: {
        patient: true,
      },
    });

    if (!tp) {
      throw new NotFoundException('Paciente no encontrado en este consultorio');
    }

    // Get recent appointments
    const appointments = await this.prisma.appointment.findMany({
      where: { tenantId, patientId },
      orderBy: { date: 'desc' },
      take: 20,
      select: {
        id: true,
        date: true,
        startTime: true,
        status: true,
        type: true,
        notes: true,
      },
    });

    return {
      data: {
        id: tp.patient.id,
        tenantPatientId: tp.id,
        name: tp.patient.name,
        phone: tp.patient.phone,
        email: tp.patient.email,
        cedula: tp.patient.cedula,
        dateOfBirth: tp.patient.dateOfBirth,
        gender: tp.patient.gender,
        address: tp.patient.address,
        notes: tp.notes,
        insurance: tp.insurance,
        isVip: tp.isVip,
        // Antecedentes (Plan Pro)
        bloodType: tp.bloodType,
        allergies: tp.allergies,
        chronicConditions: tp.chronicConditions,
        currentMedications: tp.currentMedications,
        surgeries: tp.surgeries,
        familyHistory: tp.familyHistory,
        appointments,
      },
      message: 'Paciente obtenido',
    };
  }

  async updateMedicalHistory(
    patientId: string,
    tenantId: string,
    data: {
      bloodType?: string | null;
      allergies?: string | null;
      chronicConditions?: string | null;
      currentMedications?: string | null;
      surgeries?: string | null;
      familyHistory?: string | null;
      address?: string | null;
      cedula?: string | null;
      dateOfBirth?: string | null;
      gender?: string | null;
    },
  ) {
    const tp = await this.prisma.tenantPatient.findUnique({
      where: { tenantId_patientId: { tenantId, patientId } },
    });
    if (!tp) throw new NotFoundException('Paciente no encontrado en este consultorio');

    // Campos de TenantPatient (antecedentes)
    const tpUpdate: Record<string, unknown> = {};
    for (const key of [
      'bloodType',
      'allergies',
      'chronicConditions',
      'currentMedications',
      'surgeries',
      'familyHistory',
    ] as const) {
      if (data[key] !== undefined) tpUpdate[key] = data[key];
    }

    // Campos del Patient global (demográficos)
    const patientUpdate: Record<string, unknown> = {};
    if (data.address !== undefined) patientUpdate.address = data.address;
    if (data.cedula !== undefined) patientUpdate.cedula = data.cedula;
    if (data.gender !== undefined) patientUpdate.gender = data.gender;
    if (data.dateOfBirth !== undefined) {
      patientUpdate.dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : null;
    }

    await this.prisma.$transaction([
      this.prisma.tenantPatient.update({
        where: { id: tp.id },
        data: tpUpdate,
      }),
      ...(Object.keys(patientUpdate).length > 0
        ? [this.prisma.patient.update({ where: { id: patientId }, data: patientUpdate })]
        : []),
    ]);

    return this.findById(patientId, tenantId);
  }

  async getTimeline(patientId: string, tenantId: string) {
    const tp = await this.prisma.tenantPatient.findUnique({
      where: { tenantId_patientId: { tenantId, patientId } },
    });
    if (!tp) throw new NotFoundException('Paciente no encontrado en este consultorio');

    const appointments = await this.prisma.appointment.findMany({
      where: { tenantId, patientId },
      orderBy: { date: 'desc' },
      include: {
        consultationNote: {
          select: { assessment: true, plan: true, subjective: true },
        },
        prescription: { select: { items: true, notes: true } },
        vitalSigns: {
          select: {
            bloodPressureSys: true,
            bloodPressureDia: true,
            heartRate: true,
            temperature: true,
            weight: true,
          },
        },
      },
    });

    const timeline = appointments.map((a) => ({
      appointmentId: a.id,
      date: a.date,
      status: a.status,
      reason: a.reason,
      type: a.type,
      diagnosis: a.consultationNote?.assessment ?? null,
      reasonText: a.consultationNote?.subjective ?? null,
      plan: a.consultationNote?.plan ?? null,
      hasPrescription:
        !!a.prescription &&
        (((a.prescription.items as unknown as unknown[])?.length ?? 0) > 0 ||
          !!a.prescription.notes),
      hasVitals: !!a.vitalSigns,
      vitalsSummary: a.vitalSigns
        ? {
            bp:
              a.vitalSigns.bloodPressureSys != null && a.vitalSigns.bloodPressureDia != null
                ? `${a.vitalSigns.bloodPressureSys}/${a.vitalSigns.bloodPressureDia}`
                : null,
            hr: a.vitalSigns.heartRate,
            weight: a.vitalSigns.weight,
            temp: a.vitalSigns.temperature,
          }
        : null,
    }));

    return { data: { timeline }, message: 'Línea de tiempo del paciente' };
  }

  async findByPhone(phone: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { phone },
    });

    if (!patient) {
      throw new NotFoundException('Paciente no encontrado');
    }

    return patient;
  }

  async search(tenantId: string, query: string) {
    return this.listByTenant(tenantId, query, 1, 20);
  }

  async getAppointmentHistory(patientId: string, tenantId: string) {
    const tp = await this.prisma.tenantPatient.findUnique({
      where: {
        tenantId_patientId: { tenantId, patientId },
      },
    });

    if (!tp) {
      throw new NotFoundException('Paciente no encontrado en este consultorio');
    }

    const appointments = await this.prisma.appointment.findMany({
      where: { tenantId, patientId },
      orderBy: { date: 'desc' },
      select: {
        id: true,
        date: true,
        startTime: true,
        status: true,
        type: true,
        notes: true,
      },
    });

    return {
      data: { appointments },
      message: 'Historial de citas obtenido',
    };
  }

  async update(patientId: string, tenantId: string, data: { notes?: string; insurance?: string; isVip?: boolean }) {
    const tp = await this.prisma.tenantPatient.findUnique({
      where: {
        tenantId_patientId: { tenantId, patientId },
      },
    });

    if (!tp) {
      throw new NotFoundException('Paciente no encontrado en este consultorio');
    }

    const updated = await this.prisma.tenantPatient.update({
      where: { id: tp.id },
      data: {
        notes: data.notes !== undefined ? data.notes : undefined,
        insurance: data.insurance !== undefined ? data.insurance : undefined,
        isVip: data.isVip !== undefined ? data.isVip : undefined,
      },
      include: { patient: true },
    });

    return {
      data: {
        id: updated.patient.id,
        tenantPatientId: updated.id,
        name: updated.patient.name,
        phone: updated.patient.phone,
        email: updated.patient.email,
        notes: updated.notes,
        insurance: updated.insurance,
        isVip: updated.isVip,
      },
      message: 'Paciente actualizado',
    };
  }

  /**
   * Datos NO clínicos del paciente (demografía + ARS + nº afiliado).
   * Accesible para la secretaria — no incluye antecedentes ni diagnósticos.
   */
  async getBasic(patientId: string, tenantId: string) {
    const tp = await this.prisma.tenantPatient.findUnique({
      where: { tenantId_patientId: { tenantId, patientId } },
      include: {
        patient: true,
        insuranceRef: { select: { id: true, name: true, shortName: true } },
      },
    });

    if (!tp) {
      throw new NotFoundException('Paciente no encontrado en este consultorio');
    }

    const appointments = await this.prisma.appointment.findMany({
      where: { tenantId, patientId },
      orderBy: { date: 'desc' },
      take: 20,
      select: { id: true, date: true, startTime: true, status: true, reason: true },
    });

    return {
      data: {
        id: tp.patient.id,
        tenantPatientId: tp.id,
        name: tp.patient.name,
        phone: tp.patient.phone,
        email: tp.patient.email,
        cedula: tp.patient.cedula,
        dateOfBirth: tp.patient.dateOfBirth,
        gender: tp.patient.gender,
        address: tp.patient.address,
        notes: tp.notes,
        isVip: tp.isVip,
        insuranceId: tp.insuranceId,
        insurance: tp.insuranceRef ?? null,
        insuranceLegacy: tp.insurance,
        affiliateNumber: tp.affiliateNumber,
        appointments,
      },
      message: 'Datos básicos del paciente',
    };
  }

  /** Editar datos NO clínicos (lo que puede hacer la secretaria). */
  async updateBasic(
    patientId: string,
    tenantId: string,
    data: {
      name?: string;
      cedula?: string | null;
      dateOfBirth?: string | null;
      gender?: string | null;
      address?: string | null;
      insuranceId?: string | null;
      affiliateNumber?: string | null;
      notes?: string | null;
      isVip?: boolean;
    },
  ) {
    const tp = await this.prisma.tenantPatient.findUnique({
      where: { tenantId_patientId: { tenantId, patientId } },
    });
    if (!tp) {
      throw new NotFoundException('Paciente no encontrado en este consultorio');
    }

    // Validar la ARS si se envía un id
    if (data.insuranceId) {
      const ars = await this.prisma.insurance.findUnique({
        where: { id: data.insuranceId },
      });
      if (!ars) throw new BadRequestException('ARS inválida');
    }

    // Campos del Patient global (demografía)
    const patientUpdate: Record<string, unknown> = {};
    if (data.name !== undefined) patientUpdate.name = data.name;
    if (data.cedula !== undefined) patientUpdate.cedula = data.cedula;
    if (data.address !== undefined) patientUpdate.address = data.address;
    if (data.gender !== undefined) patientUpdate.gender = data.gender;
    if (data.dateOfBirth !== undefined) {
      patientUpdate.dateOfBirth = data.dateOfBirth
        ? new Date(data.dateOfBirth)
        : null;
    }

    // Campos del TenantPatient (relación con el consultorio)
    const tpUpdate: Record<string, unknown> = {};
    if (data.insuranceId !== undefined) tpUpdate.insuranceId = data.insuranceId;
    if (data.affiliateNumber !== undefined)
      tpUpdate.affiliateNumber = data.affiliateNumber;
    if (data.notes !== undefined) tpUpdate.notes = data.notes;
    if (data.isVip !== undefined) tpUpdate.isVip = data.isVip;

    await this.prisma.$transaction([
      ...(Object.keys(tpUpdate).length > 0
        ? [this.prisma.tenantPatient.update({ where: { id: tp.id }, data: tpUpdate })]
        : []),
      ...(Object.keys(patientUpdate).length > 0
        ? [this.prisma.patient.update({ where: { id: patientId }, data: patientUpdate })]
        : []),
    ]);

    return this.getBasic(patientId, tenantId);
  }
}
