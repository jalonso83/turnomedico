import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { MedicalRecordsService } from './medical-records.service';
import { UpsertConsultationNoteDto } from './dto/consultation-note.dto';
import { UpsertVitalSignsDto } from './dto/vital-signs.dto';
import { UpsertPrescriptionDto } from './dto/prescription.dto';

// Expediente clínico: solo el doctor. La secretaria NUNCA ve ni edita esto.
@ApiTags('Dashboard - Medical Records (EMR)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Roles('DOCTOR')
@Controller('dashboard/appointments/:appointmentId')
export class MedicalRecordsController {
  constructor(private readonly service: MedicalRecordsService) {}

  @Get('medical-record')
  @ApiOperation({ summary: 'Get full medical record for an appointment (note + vitals + prescription + antecedentes)' })
  async getFull(
    @Param('appointmentId') appointmentId: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.service.getFullRecord(appointmentId, tenantId);
  }

  @Put('consultation-note')
  @ApiOperation({ summary: 'Create or update the SOAP consultation note' })
  async upsertNote(
    @Param('appointmentId') appointmentId: string,
    @CurrentTenant() tenantId: string,
    @Body() dto: UpsertConsultationNoteDto,
  ) {
    return this.service.upsertConsultationNote(appointmentId, tenantId, dto);
  }

  @Put('vital-signs')
  @ApiOperation({ summary: 'Create or update vital signs for the appointment' })
  async upsertVitals(
    @Param('appointmentId') appointmentId: string,
    @CurrentTenant() tenantId: string,
    @Body() dto: UpsertVitalSignsDto,
  ) {
    return this.service.upsertVitalSigns(appointmentId, tenantId, dto);
  }

  @Put('prescription')
  @ApiOperation({ summary: 'Create or update the prescription for the appointment' })
  async upsertPrescription(
    @Param('appointmentId') appointmentId: string,
    @CurrentTenant() tenantId: string,
    @Body() dto: UpsertPrescriptionDto,
  ) {
    return this.service.upsertPrescription(appointmentId, tenantId, dto);
  }
}
