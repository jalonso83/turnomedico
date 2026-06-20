import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { AppointmentsService } from './appointments.service';
import { UpdateStatusDto } from './dto/update-status.dto';
import { AppointmentReasonEnum } from './dto/book-appointment.dto';

@ApiTags('Dashboard - Appointments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('dashboard/appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get('today')
  @ApiOperation({ summary: "Get today's appointments for the logged-in doctor" })
  async getToday(@CurrentTenant() tenantId: string) {
    return this.appointmentsService.getTodayAppointments(tenantId);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Change appointment status (confirm, check-in, start, complete, no-show)' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @CurrentTenant() tenantId: string,
  ) {
    return this.appointmentsService.updateStatus(id, dto, tenantId);
  }

  @Post('walk-in')
  @ApiOperation({ summary: 'Register a walk-in patient' })
  async createWalkIn(
    @CurrentTenant() tenantId: string,
    @Body()
    data: {
      patientName: string;
      patientPhone: string;
      notes?: string;
      reason?: AppointmentReasonEnum;
    },
  ) {
    return this.appointmentsService.createWalkIn(tenantId, data);
  }

  @Put(':id/entered-consultory')
  @ApiOperation({ summary: 'Mark patient entered consultory (start consultation)' })
  async markEnteredConsultory(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.appointmentsService.markEnteredConsultory(id, tenantId);
  }

  @Put(':id/left-consultory')
  @ApiOperation({ summary: 'Mark patient left consultory (end consultation) + record metrics' })
  async markLeftConsultory(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.appointmentsService.markLeftConsultory(id, tenantId);
  }
}
