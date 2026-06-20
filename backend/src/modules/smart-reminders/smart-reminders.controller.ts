import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SmartRemindersService } from './smart-reminders.service';

// Estadísticas de consulta del doctor: solo el doctor.
@ApiTags('Smart Reminders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Roles('DOCTOR')
@Controller('smart-reminders')
export class SmartRemindersController {
  constructor(private readonly smartRemindersService: SmartRemindersService) {}

  @Get('my-stats')
  @ApiOperation({ summary: 'Consultation stats of the currently logged-in doctor' })
  async getMyStats(
    @CurrentUser() user: { userId: string },
    @CurrentTenant() tenantId: string,
  ) {
    const stats = await this.smartRemindersService.getDoctorStats(
      user.userId,
      tenantId,
    );
    return {
      data: stats,
      message: 'Doctor consultation statistics',
    };
  }
}
