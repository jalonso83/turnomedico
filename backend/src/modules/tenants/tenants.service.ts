import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { OnboardingDto } from './dto/onboarding.dto';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        doctorProfile: {
          include: {
            insurances: {
              include: {
                insurance: {
                  select: { id: true, name: true, slug: true, shortName: true, logoUrl: true },
                },
              },
            },
          },
        },
        officeConfig: true,
        subscription: {
          include: { plan: true },
        },
        users: {
          where: { role: 'DOCTOR' },
          select: { id: true, name: true, email: true, phone: true },
          take: 1,
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Consultorio no encontrado');
    }

    const doctorUser = tenant.users[0] ?? null;

    const profile = tenant.doctorProfile
      ? {
          ...tenant.doctorProfile,
          insurances: tenant.doctorProfile.insurances.map((di) => ({
            ...di.insurance,
            patientCopay: di.patientCopay,
            insuranceCoverage: di.insuranceCoverage,
          })),
        }
      : null;

    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        isActive: tenant.isActive,
      },
      doctorProfile: profile,
      user: doctorUser,
      officeConfig: tenant.officeConfig,
      subscription: tenant.subscription
        ? {
            status: tenant.subscription.status,
            planName: tenant.subscription.plan.name,
            trialEndsAt: tenant.subscription.trialEndsAt,
            currentPeriodEnd: tenant.subscription.currentPeriodEnd,
          }
        : null,
    };
  }

  async update(id: string, data: any) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: { doctorProfile: true },
    });

    if (!tenant) {
      throw new NotFoundException('Consultorio no encontrado');
    }

    // Separate tenant fields from profile fields
    const tenantFields: any = {};
    const profileFields: any = {};

    // Tenant-level fields
    if (data.name !== undefined) tenantFields.name = data.name;

    // DoctorProfile fields
    const profileKeys = [
      'specialty', 'subspecialty', 'licenseNumber', 'bio', 'photoUrl',
      'consultationFee', 'currency', 'phone', 'alternatePhone',
      'consultorioName', 'address', 'floor', 'reference',
      'city', 'sector', 'latitude', 'longitude', 'googlePlaceId',
      'languages', 'isPublicVisible', 'agendaActive',
    ];

    for (const key of profileKeys) {
      if (data[key] !== undefined) {
        profileFields[key] = data[key];
      }
    }

    // Forma nueva: ARS con montos pactados. Forma legacy: solo IDs (sin montos).
    type InsuranceInput = {
      insuranceId: string;
      patientCopay?: number | null;
      insuranceCoverage?: number | null;
    };
    const insurances: InsuranceInput[] | undefined = Array.isArray(data.insurances)
      ? (data.insurances as InsuranceInput[])
      : Array.isArray(data.insuranceIds)
        ? (data.insuranceIds as string[]).map((insuranceId) => ({ insuranceId }))
        : undefined;

    await this.prisma.$transaction(async (tx) => {
      if (Object.keys(tenantFields).length > 0) {
        await tx.tenant.update({ where: { id }, data: tenantFields });
      }

      if (Object.keys(profileFields).length > 0 && tenant.doctorProfile) {
        await tx.doctorProfile.update({
          where: { tenantId: id },
          data: profileFields,
        });
      }

      if (insurances && tenant.doctorProfile) {
        const profileId = tenant.doctorProfile.id;
        await tx.doctorInsurance.deleteMany({ where: { doctorProfileId: profileId } });
        if (insurances.length > 0) {
          await tx.doctorInsurance.createMany({
            data: insurances.map((it) => ({
              doctorProfileId: profileId,
              insuranceId: it.insuranceId,
              patientCopay: it.patientCopay ?? null,
              insuranceCoverage: it.insuranceCoverage ?? null,
            })),
            skipDuplicates: true,
          });
        }
      }
    });

    // Re-fetch full data
    return this.findById(id);
  }

  async completeOnboarding(tenantId: string, dto: OnboardingDto) {
    const profile = await this.prisma.doctorProfile.findUnique({
      where: { tenantId },
    });

    if (!profile) {
      throw new NotFoundException('Perfil de doctor no encontrado');
    }

    const updatedProfile = await this.prisma.doctorProfile.update({
      where: { tenantId },
      data: {
        consultorioName: dto.consultorioName,
        address: dto.address,
        floor: dto.floor ?? null,
        reference: dto.reference ?? null,
        city: dto.city,
        sector: dto.sector ?? null,
        latitude: dto.latitude ?? null,
        longitude: dto.longitude ?? null,
        googlePlaceId: dto.googlePlaceId ?? null,
        onboardingCompleted: true,
      },
    });

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { slug: true },
    });

    return { profile: updatedProfile, slug: tenant?.slug ?? '' };
  }

  async toggleAgendaActive(tenantId: string) {
    const profile = await this.prisma.doctorProfile.findUnique({
      where: { tenantId },
    });

    if (!profile) {
      throw new NotFoundException('Perfil de doctor no encontrado');
    }

    const updated = await this.prisma.doctorProfile.update({
      where: { tenantId },
      data: { agendaActive: !profile.agendaActive },
    });

    return { agendaActive: updated.agendaActive };
  }

  async getSettings(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { officeConfig: true, doctorProfile: true },
    });

    if (!tenant) {
      throw new NotFoundException('Consultorio no encontrado');
    }

    return {
      officeConfig: tenant.officeConfig,
      profile: tenant.doctorProfile,
    };
  }

  async updateSettings(tenantId: string, settings: any) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      throw new NotFoundException('Consultorio no encontrado');
    }

    const officeConfig = await this.prisma.officeConfig.upsert({
      where: { tenantId },
      create: {
        tenantId,
        displayName: settings.displayName || tenant.name,
        ...settings,
      },
      update: settings,
    });

    return officeConfig;
  }

  async generateDisplayToken(tenantId: string) {
    const config = await this.prisma.officeConfig.findUnique({
      where: { tenantId },
      select: { displayToken: true },
    });

    if (!config) {
      throw new NotFoundException('Configuración de oficina no encontrada');
    }

    return { displayToken: config.displayToken };
  }
}
