import {
  Body,
  Controller,
  Delete,
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
import { CloseCashDto } from './dto/close-cash.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Dashboard - Payments (Caja)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
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

  @Get('cash/range')
  @ApiOperation({ summary: 'Facturación día por día en un rango, con totales del período' })
  @ApiQuery({ name: 'from', required: true, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'to', required: true, description: 'YYYY-MM-DD' })
  async cashRange(
    @CurrentTenant() tenantId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.service.getCashRange(tenantId, from, to);
  }

  @Get('cash/closing')
  @ApiOperation({ summary: 'Cierre de caja de un día (null si no está cerrado)' })
  @ApiQuery({ name: 'date', required: true, description: 'YYYY-MM-DD' })
  async closing(@CurrentTenant() tenantId: string, @Query('date') date: string) {
    return this.service.getClosing(tenantId, date);
  }

  // Cerrar y reabrir son del doctor: congelan la contabilidad del día.
  @Post('cash/closing')
  @Roles('DOCTOR')
  @ApiOperation({ summary: 'Cerrar la caja del día (bloquea la edición de sus cobros)' })
  async closeCash(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: { userId: string },
    @Body() dto: CloseCashDto,
  ) {
    return this.service.closeDay(tenantId, user?.userId, dto);
  }

  @Delete('cash/closing/:id')
  @Roles('DOCTOR')
  @ApiOperation({ summary: 'Reabrir un día cerrado' })
  async reopenCash(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
  ) {
    return this.service.reopenDay(tenantId, id, user?.userId);
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
