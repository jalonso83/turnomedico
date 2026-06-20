import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

interface JwtPayload {
  userId: string;
  tenantId: string;
  role: string;
  email: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (existingUser) {
      throw new ConflictException('Ya existe una cuenta con este email');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const slug = await this.generateUniqueSlug(dto.name);

    const result = await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: dto.name,
          slug,
        },
      });

      const user = await tx.user.create({
        data: {
          email: dto.email.toLowerCase().trim(),
          passwordHash,
          role: 'DOCTOR',
          name: dto.name,
          phone: dto.phone,
          tenantId: tenant.id,
        },
      });

      await tx.doctorProfile.create({
        data: {
          tenantId: tenant.id,
          specialty: dto.specialty,
          city: dto.city,
          phone: dto.phone,
        },
      });

      await tx.officeConfig.create({
        data: {
          tenantId: tenant.id,
          displayName: dto.name,
        },
      });

      return { tenant, user };
    });

    const { accessToken, refreshToken } = await this.generateTokens({
      userId: result.user.id,
      tenantId: result.tenant.id,
      role: result.user.role,
      email: result.user.email,
    });

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: result.user.id },
      data: { refreshToken: refreshTokenHash },
    });

    return {
      data: {
        accessToken,
        refreshToken,
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role,
        },
      },
      message: 'Registro exitoso',
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.isActive) {
      throw new ForbiddenException('La cuenta está desactivada');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const { accessToken, refreshToken } = await this.generateTokens({
      userId: user.id,
      tenantId: user.tenantId!,
      role: user.role,
      email: user.email,
    });

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: refreshTokenHash },
    });

    return {
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      message: 'Login exitoso',
    };
  }

  async refreshToken(token: string) {
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET', this.configService.get<string>('JWT_SECRET', 'changeme')),
      });
    } catch {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || !user.isActive || !user.refreshToken) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    const tokenMatches = await bcrypt.compare(token, user.refreshToken);
    if (!tokenMatches) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    const tokens = await this.generateTokens({
      userId: user.id,
      tenantId: user.tenantId!,
      role: user.role,
      email: user.email,
    });

    const newRefreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshTokenHash },
    });

    return {
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
      message: 'Token renovado exitosamente',
    };
  }

  async requestPatientOtp(phone: string) {
    // Patient OTP flow - to be implemented with SMS/notification service
    throw new Error('Not implemented');
  }

  async verifyPatientOtp(phone: string, otp: string) {
    // Patient OTP verification - to be implemented with SMS/notification service
    throw new Error('Not implemented');
  }

  private async generateTokens(payload: JwtPayload): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = this.jwtService.sign(payload as any, {
      secret: this.configService.get<string>('JWT_SECRET', 'changeme'),
      expiresIn: this.configService.get('JWT_EXPIRATION', '15m') as any,
    });

    const refreshToken = this.jwtService.sign(payload as any, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET', this.configService.get<string>('JWT_SECRET', 'changeme')),
      expiresIn: '7d' as any,
    });

    return { accessToken, refreshToken };
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const baseSlug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove accents
      .replace(/[^a-z0-9\s-]/g, '')    // remove special chars
      .replace(/\s+/g, '-')            // spaces to hyphens
      .replace(/-+/g, '-')             // collapse multiple hyphens
      .replace(/^-|-$/g, '');          // trim hyphens

    const suffix = randomBytes(2).toString('hex'); // 4 random hex chars
    const slug = `${baseSlug}-${suffix}`;

    // Check for collisions (extremely unlikely but safe)
    const existing = await this.prisma.tenant.findUnique({
      where: { slug },
    });

    if (existing) {
      const fallbackSuffix = randomBytes(4).toString('hex');
      return `${baseSlug}-${fallbackSuffix}`;
    }

    return slug;
  }
}
