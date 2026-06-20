import {
  Controller,
  Get,
  Put,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { PatientsService } from './patients.service';
import { UpdatePatientBasicDto } from './dto/update-patient-basic.dto';

// Listado y datos básicos: doctor + secretaria.
// Detalle clínico / antecedentes / timeline: solo el doctor (@Roles('DOCTOR')).
@ApiTags('Dashboard - Patients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('dashboard/patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get()
  @ApiOperation({ summary: 'List patients for this tenant' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async list(
    @CurrentTenant() tenantId: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.patientsService.listByTenant(
      tenantId,
      search,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  // ── Datos básicos (NO clínicos) — secretaria + doctor ──────────────

  @Get(':id/basic')
  @ApiOperation({ summary: 'Get patient non-clinical data (demographics + ARS)' })
  async getBasic(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.patientsService.getBasic(id, tenantId);
  }

  @Patch(':id/basic')
  @ApiOperation({ summary: 'Update patient non-clinical data (demographics + ARS + afiliado)' })
  async updateBasic(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdatePatientBasicDto,
  ) {
    return this.patientsService.updateBasic(id, tenantId, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update patient notes/insurance/VIP' })
  async update(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @Body() data: { notes?: string; insurance?: string; isVip?: boolean },
  ) {
    return this.patientsService.update(id, tenantId, data);
  }

  // ── Expediente clínico — SOLO el doctor ────────────────────────────

  @Get(':id')
  @Roles('DOCTOR')
  @ApiOperation({ summary: 'Get patient details (incl. antecedentes) — doctor only' })
  async findById(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.patientsService.findById(id, tenantId);
  }

  @Get(':id/history')
  @Roles('DOCTOR')
  @ApiOperation({ summary: 'Get patient appointment history — doctor only' })
  async getHistory(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.patientsService.getAppointmentHistory(id, tenantId);
  }

  @Patch(':id/medical-history')
  @Roles('DOCTOR')
  @ApiOperation({ summary: 'Update medical history (antecedentes) and demographics — doctor only' })
  async updateMedicalHistory(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @Body()
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
    return this.patientsService.updateMedicalHistory(id, tenantId, data);
  }

  @Get(':id/timeline')
  @Roles('DOCTOR')
  @ApiOperation({ summary: 'Get patient timeline with diagnosis + vitals + Rx flags — doctor only' })
  async getTimeline(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.patientsService.getTimeline(id, tenantId);
  }
}
