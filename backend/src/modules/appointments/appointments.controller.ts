import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { AppointmentsService } from './appointments.service';
import { UpdateStatusDto } from './dto/update-status.dto';
import { AppointmentReasonEnum } from './dto/book-appointment.dto';
import {
  ConfirmDayDto,
  CreateAppointmentDto,
  MarkNotifiedDto,
  ReorderQueueDto,
} from './dto/queue.dto';

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

  @Get('by-date')
  @ApiOperation({
    summary: 'Agenda de un día cualquiera (para preparar días futuros)',
  })
  @ApiQuery({ name: 'date', required: false, description: 'YYYY-MM-DD (default: hoy)' })
  async getByDate(@CurrentTenant() tenantId: string, @Query('date') date?: string) {
    return this.appointmentsService.getAppointmentsByDate(tenantId, date);
  }

  @Get('slots')
  @ApiOperation({ summary: 'Disponibilidad de un día (autenticado, para agendar)' })
  @ApiQuery({ name: 'date', required: true, description: 'YYYY-MM-DD' })
  async slots(@CurrentTenant() tenantId: string, @Query('date') date: string) {
    return this.appointmentsService.getAvailabilityForTenant(tenantId, date);
  }

  @Post()
  @ApiOperation({
    summary: 'Agendar una cita futura para un paciente existente (permite SEGUIMIENTO)',
  })
  async create(@CurrentTenant() tenantId: string, @Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.createAppointment(tenantId, {
      patientId: dto.patientId,
      date: dto.date,
      reason: dto.reason,
      parentAppointmentId: dto.parentAppointmentId,
      notes: dto.notes,
    });
  }

  @Put('reorder')
  @ApiOperation({
    summary:
      'Reordenar los turnos del día. Conserva el número de quien ya fue avisado ' +
      'o ya llegó; reparte los libres entre el resto.',
  })
  async reorder(@CurrentTenant() tenantId: string, @Body() dto: ReorderQueueDto) {
    // `items` es la forma nueva (con número explícito); `orderedIds` la vieja.
    // Se aceptan las dos mientras conviven versiones de frontend y backend.
    const entrada =
      dto.items ?? (dto.orderedIds ?? []).map((id) => ({ id, queuePosition: null }));
    if (entrada.length === 0) {
      throw new BadRequestException('Hay que mandar items u orderedIds');
    }
    return this.appointmentsService.reorderQueue(tenantId, dto.date, entrada);
  }

  @Post('confirm-day')
  @ApiOperation({
    summary:
      'Confirmar el día: pasa las pendientes a confirmadas y numera las que no tengan turno. ' +
      'Respeta los números ya asignados.',
  })
  async confirmDay(@CurrentTenant() tenantId: string, @Body() dto: ConfirmDayDto) {
    return this.appointmentsService.confirmDay(tenantId, dto.date);
  }

  @Post(':id/notified')
  @ApiOperation({ summary: 'Registrar que se le avisó el turno al paciente por WhatsApp' })
  async markNotified(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: MarkNotifiedDto,
  ) {
    return this.appointmentsService.markNotified(tenantId, id, dto.content);
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
