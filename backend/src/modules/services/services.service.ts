import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { SetServiceInsurancesDto } from './dto/set-service-insurances.dto';

type ServiceWithInsurances = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  category: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  insurances: Array<{
    patientCopay: number | null;
    insuranceCoverage: number | null;
    insurance: { id: string; name: string; shortName: string | null };
  }>;
};

const SERVICE_INCLUDE = {
  insurances: {
    select: {
      patientCopay: true,
      insuranceCoverage: true,
      insurance: { select: { id: true, name: true, shortName: true } },
    },
  },
} as const;

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Aplana las tarifas para que el frontend no tenga que navegar la relación. */
  private shape(service: ServiceWithInsurances) {
    return {
      id: service.id,
      name: service.name,
      description: service.description,
      price: service.price,
      currency: service.currency,
      category: service.category,
      isActive: service.isActive,
      sortOrder: service.sortOrder,
      createdAt: service.createdAt,
      insurances: service.insurances.map((si) => ({
        insuranceId: si.insurance.id,
        name: si.insurance.name,
        shortName: si.insurance.shortName,
        patientCopay: si.patientCopay,
        insuranceCoverage: si.insuranceCoverage,
      })),
    };
  }

  private async getOwnedService(tenantId: string, id: string) {
    const service = await this.prisma.service.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });
    if (!service) {
      throw new NotFoundException('Servicio no encontrado');
    }
    return service;
  }

  /**
   * Nombre único por consultorio entre los servicios ACTIVOS.
   * Un servicio desactivado no bloquea reutilizar el nombre.
   */
  private async assertNameFree(tenantId: string, name: string, exceptId?: string) {
    const clash = await this.prisma.service.findFirst({
      where: {
        tenantId,
        isActive: true,
        name: { equals: name.trim(), mode: 'insensitive' },
        ...(exceptId ? { id: { not: exceptId } } : {}),
      },
      select: { id: true },
    });
    if (clash) {
      throw new ConflictException('Ya existe un servicio activo con ese nombre');
    }
  }

  async list(tenantId: string, includeInactive = false) {
    const services = await this.prisma.service.findMany({
      where: { tenantId, ...(includeInactive ? {} : { isActive: true }) },
      include: SERVICE_INCLUDE,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return {
      data: services.map((s) => this.shape(s)),
      message: 'Catálogo de servicios',
    };
  }

  async create(tenantId: string, dto: CreateServiceDto) {
    await this.assertNameFree(tenantId, dto.name);

    const profile = await this.prisma.doctorProfile.findUnique({
      where: { tenantId },
      select: { currency: true },
    });

    const service = await this.prisma.service.create({
      data: {
        tenantId,
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        price: dto.price,
        currency: profile?.currency ?? 'DOP',
        category: dto.category?.trim() || null,
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
      },
      include: SERVICE_INCLUDE,
    });

    return { data: this.shape(service), message: 'Servicio creado' };
  }

  async update(tenantId: string, id: string, dto: UpdateServiceDto) {
    await this.getOwnedService(tenantId, id);

    if (dto.name != null) {
      await this.assertNameFree(tenantId, dto.name, id);
    }

    const service = await this.prisma.service.update({
      where: { id },
      data: {
        ...(dto.name != null ? { name: dto.name.trim() } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description?.trim() || null }
          : {}),
        ...(dto.price != null ? { price: dto.price } : {}),
        ...(dto.category !== undefined ? { category: dto.category?.trim() || null } : {}),
        ...(dto.isActive != null ? { isActive: dto.isActive } : {}),
        ...(dto.sortOrder != null ? { sortOrder: dto.sortOrder } : {}),
      },
      include: SERVICE_INCLUDE,
    });

    return { data: this.shape(service), message: 'Servicio actualizado' };
  }

  /**
   * Desactiva en vez de borrar: hay líneas de facturas históricas
   * que apuntan al servicio y no pueden quedar huérfanas.
   */
  async deactivate(tenantId: string, id: string) {
    await this.getOwnedService(tenantId, id);

    const service = await this.prisma.service.update({
      where: { id },
      data: { isActive: false },
      include: SERVICE_INCLUDE,
    });

    return { data: this.shape(service), message: 'Servicio desactivado' };
  }

  /**
   * Reemplaza el conjunto de tarifas del servicio.
   * Solo se aceptan ARS que el doctor ya haya marcado como aceptadas
   * en su configuración (DoctorInsurance).
   */
  async setInsurances(tenantId: string, id: string, dto: SetServiceInsurancesDto) {
    await this.getOwnedService(tenantId, id);

    const profile = await this.prisma.doctorProfile.findUnique({
      where: { tenantId },
      select: { insurances: { select: { insuranceId: true } } },
    });
    const accepted = new Set((profile?.insurances ?? []).map((i) => i.insuranceId));

    const seen = new Set<string>();
    for (const t of dto.tariffs) {
      if (!accepted.has(t.insuranceId)) {
        throw new BadRequestException(
          'Solo se pueden configurar tarifas de las ARS que el doctor acepta',
        );
      }
      if (seen.has(t.insuranceId)) {
        throw new BadRequestException('Hay una ARS repetida en la lista');
      }
      seen.add(t.insuranceId);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.serviceInsurance.deleteMany({ where: { serviceId: id } });
      if (dto.tariffs.length > 0) {
        await tx.serviceInsurance.createMany({
          data: dto.tariffs.map((t) => ({
            serviceId: id,
            insuranceId: t.insuranceId,
            patientCopay: t.patientCopay ?? null,
            insuranceCoverage: t.insuranceCoverage ?? null,
          })),
        });
      }
    });

    const service = await this.prisma.service.findUniqueOrThrow({
      where: { id },
      include: SERVICE_INCLUDE,
    });

    return { data: this.shape(service), message: 'Tarifas actualizadas' };
  }
}
