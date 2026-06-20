import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { TenantsService } from './tenants.service';
import { OnboardingDto } from './dto/onboarding.dto';

// La secretaria puede LEER el consultorio (lo necesita el layout) y la config de
// pantalla, pero la configuración del negocio (perfil, tarifas, onboarding) es solo del doctor.
@ApiTags('Tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('dashboard/tenant')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  @ApiOperation({ summary: 'Get current tenant details' })
  async getCurrent(@CurrentTenant() tenantId: string) {
    const tenant = await this.tenantsService.findById(tenantId);
    return { data: tenant, message: 'Consultorio obtenido' };
  }

  @Put()
  @Roles('DOCTOR')
  @ApiOperation({ summary: 'Update tenant details' })
  async update(
    @CurrentTenant() tenantId: string,
    @Body() data: any,
  ) {
    const tenant = await this.tenantsService.update(tenantId, data);
    return { data: tenant, message: 'Consultorio actualizado' };
  }

  @Put('onboarding')
  @Roles('DOCTOR')
  @ApiOperation({ summary: 'Complete onboarding with location data' })
  async completeOnboarding(
    @CurrentTenant() tenantId: string,
    @Body() dto: OnboardingDto,
  ) {
    const result = await this.tenantsService.completeOnboarding(tenantId, dto);
    return { data: result, message: 'Onboarding completado' };
  }

  @Put('agenda-toggle')
  @Roles('DOCTOR')
  @ApiOperation({ summary: 'Toggle agenda active/inactive' })
  async toggleAgenda(@CurrentTenant() tenantId: string) {
    const result = await this.tenantsService.toggleAgendaActive(tenantId);
    return { data: result, message: 'Estado de agenda actualizado' };
  }

  @Get('settings')
  @ApiOperation({ summary: 'Get tenant settings' })
  async getSettings(@CurrentTenant() tenantId: string) {
    const settings = await this.tenantsService.getSettings(tenantId);
    return { data: settings, message: 'Configuración obtenida' };
  }

  @Put('settings')
  @Roles('DOCTOR')
  @ApiOperation({ summary: 'Update tenant settings' })
  async updateSettings(
    @CurrentTenant() tenantId: string,
    @Body() settings: any,
  ) {
    const config = await this.tenantsService.updateSettings(tenantId, settings);
    return { data: config, message: 'Configuración actualizada' };
  }

  @Get('display-token')
  @ApiOperation({ summary: 'Get display screen token' })
  async getDisplayToken(@CurrentTenant() tenantId: string) {
    const result = await this.tenantsService.generateDisplayToken(tenantId);
    return { data: result, message: 'Token obtenido' };
  }
}
