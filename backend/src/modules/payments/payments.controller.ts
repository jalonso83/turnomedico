import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaymentsService } from './payments.service';
import { RegisterPaymentDto } from './dto/register-payment.dto';

@ApiTags('Dashboard - Payments (Caja)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('dashboard')
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  @Get('appointments/:appointmentId/payment')
  @ApiOperation({ summary: 'Contexto de cobro (tarifa + ARS configuradas + cobro existente)' })
  async getContext(
    @Param('appointmentId') appointmentId: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.service.getPaymentContext(appointmentId, tenantId);
  }

  @Post('appointments/:appointmentId/payment')
  @ApiOperation({ summary: 'Registrar / actualizar el cobro de la consulta' })
  async upsert(
    @Param('appointmentId') appointmentId: string,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: { userId: string },
    @Body() dto: RegisterPaymentDto,
  ) {
    return this.service.upsertPayment(appointmentId, tenantId, user?.userId, dto);
  }

  @Get('cash/today')
  @ApiOperation({ summary: 'Resumen de caja del día (efectivo, por-cobrar por ARS, pendientes)' })
  @ApiQuery({ name: 'date', required: false, description: 'YYYY-MM-DD (default: hoy en RD)' })
  async cash(
    @CurrentTenant() tenantId: string,
    @Query('date') date?: string,
  ) {
    return this.service.getCashSummary(tenantId, date);
  }
}
