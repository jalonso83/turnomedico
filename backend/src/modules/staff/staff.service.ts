import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';

// Campos seguros de la secretaria que se devuelven al frontend (nunca el hash).
const STAFF_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  isActive: true,
  canManageSchedule: true,
  lastLoginAt: true,
  createdAt: true,
} as const;

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}

  /** Datos del usuario logueado (doctor o secretaria) para que el frontend arme su vista por rol. */
  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        canManageSchedule: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return { data: user };
  }

  /** Lista las secretarias del consultorio. */
  async list(tenantId: string) {
    const staff = await this.prisma.user.findMany({
      where: { tenantId, role: 'SECRETARY' },
      select: STAFF_SELECT,
      orderBy: { createdAt: 'asc' },
    });

    return { data: staff };
  }

  /** El doctor crea la cuenta de su secretaria. */
  async create(tenantId: string, dto: CreateStaffDto) {
    const email = dto.email.toLowerCase().trim();

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Ya existe una cuenta con este email');
    }

    await this.assertQuota(tenantId);

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        tenantId,
        email,
        passwordHash,
        role: 'SECRETARY',
        name: dto.name.trim(),
        phone: dto.phone,
        canManageSchedule: dto.canManageSchedule ?? true,
      },
      select: STAFF_SELECT,
    });

    return { data: user, message: 'Secretaria creada' };
  }

  /** Editar permisos/estado/contraseña de una secretaria. */
  async update(tenantId: string, id: string, dto: UpdateStaffDto) {
    const target = await this.findSecretary(tenantId, id);

    const data: {
      name?: string;
      phone?: string;
      canManageSchedule?: boolean;
      isActive?: boolean;
      passwordHash?: string;
      refreshToken?: string | null;
    } = {};

    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.canManageSchedule !== undefined)
      data.canManageSchedule = dto.canManageSchedule;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.password !== undefined)
      data.passwordHash = await bcrypt.hash(dto.password, 10);

    // Al desactivar o cambiar contraseña, invalidamos la sesión activa.
    if (dto.isActive === false || dto.password !== undefined) {
      data.refreshToken = null;
    }

    const user = await this.prisma.user.update({
      where: { id: target.id },
      data,
      select: STAFF_SELECT,
    });

    return { data: user, message: 'Secretaria actualizada' };
  }

  /** Desactiva (soft) la cuenta de la secretaria. */
  async remove(tenantId: string, id: string) {
    const target = await this.findSecretary(tenantId, id);

    const user = await this.prisma.user.update({
      where: { id: target.id },
      data: { isActive: false, refreshToken: null },
      select: STAFF_SELECT,
    });

    return { data: user, message: 'Secretaria desactivada' };
  }

  /** Verifica que la secretaria exista y pertenezca a este consultorio. */
  private async findSecretary(tenantId: string, id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId, role: 'SECRETARY' },
    });

    if (!user) {
      throw new NotFoundException('Secretaria no encontrada');
    }

    return user;
  }

  /** Valida que no se exceda el límite de secretarias activas del plan. */
  private async assertQuota(tenantId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
      include: { plan: true },
    });
    const max = subscription?.plan?.maxSecretaries ?? 1;

    const activeCount = await this.prisma.user.count({
      where: { tenantId, role: 'SECRETARY', isActive: true },
    });

    if (activeCount >= max) {
      throw new ForbiddenException(
        `Tu plan permite hasta ${max} secretaria(s) activa(s). Desactiva una o actualiza tu plan.`,
      );
    }
  }
}
