import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { SetServiceInsurancesDto } from './dto/set-service-insurances.dto';

@ApiTags('Dashboard - Services (Catálogo)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('dashboard/services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  // La secretaria SÍ lee el catálogo: lo necesita para facturar.
  @Get()
  @Roles('DOCTOR', 'SECRETARY')
  @ApiOperation({ summary: 'Listar servicios con sus tarifas por ARS' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  async list(
    @CurrentTenant() tenantId: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.servicesService.list(tenantId, includeInactive === 'true');
  }

  // Los precios son configuración del negocio: solo el doctor.
  @Post()
  @Roles('DOCTOR')
  @ApiOperation({ summary: 'Crear un servicio' })
  async create(@CurrentTenant() tenantId: string, @Body() dto: CreateServiceDto) {
    return this.servicesService.create(tenantId, dto);
  }

  @Patch(':id')
  @Roles('DOCTOR')
  @ApiOperation({ summary: 'Editar un servicio' })
  async update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.servicesService.update(tenantId, id, dto);
  }

  @Put(':id/insurances')
  @Roles('DOCTOR')
  @ApiOperation({
    summary: 'Reemplazar las tarifas por ARS del servicio (copago paciente / aporte ARS)',
  })
  async setInsurances(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: SetServiceInsurancesDto,
  ) {
    return this.servicesService.setInsurances(tenantId, id, dto);
  }

  @Delete(':id')
  @Roles('DOCTOR')
  @ApiOperation({ summary: 'Desactivar un servicio (no se borra: hay facturas que lo referencian)' })
  async remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.servicesService.deactivate(tenantId, id);
  }
}
