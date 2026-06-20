import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { ScheduleGuard } from '../../common/guards/schedule.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { SchedulesService } from './schedules.service';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { CreateOverrideDto } from './dto/create-override.dto';
import { BlockRangeDto } from './dto/block-range.dto';

@ApiTags('Schedules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('dashboard')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get('schedules')
  @ApiOperation({ summary: 'Get weekly schedule (all 7 days)' })
  async getWeeklySchedule(@CurrentTenant() tenantId: string) {
    const schedules = await this.schedulesService.getWeeklySchedule(tenantId);
    return { data: schedules, message: 'Horario semanal obtenido' };
  }

  @Put('schedules')
  @UseGuards(ScheduleGuard)
  @ApiOperation({ summary: 'Update weekly schedule (bulk upsert)' })
  async updateWeeklySchedule(
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateScheduleDto,
  ) {
    const schedules = await this.schedulesService.updateWeeklySchedule(
      tenantId,
      dto,
    );
    return { data: schedules, message: 'Horario semanal actualizado' };
  }

  @Get('schedule-overrides')
  @ApiOperation({ summary: 'Get schedule overrides for date range (defaults: today → +6 months)' })
  @ApiQuery({ name: 'from', required: false, example: '2026-04-01' })
  @ApiQuery({ name: 'to', required: false, example: '2026-04-30' })
  async getOverrides(
    @CurrentTenant() tenantId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const overrides = await this.schedulesService.getOverrides(
      tenantId,
      from,
      to,
    );
    return { data: overrides, message: 'Excepciones obtenidas' };
  }

  @Post('schedule-overrides')
  @UseGuards(ScheduleGuard)
  @ApiOperation({ summary: 'Create a schedule override (block day or custom hours)' })
  async createOverride(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateOverrideDto,
  ) {
    const override = await this.schedulesService.createOverride(tenantId, dto);
    return { data: override, message: 'Excepción creada' };
  }

  @Post('schedule-overrides/range')
  @UseGuards(ScheduleGuard)
  @ApiOperation({ summary: 'Block a range of days at once (e.g. vacaciones)' })
  async blockRange(
    @CurrentTenant() tenantId: string,
    @Body() dto: BlockRangeDto,
  ) {
    const overrides = await this.schedulesService.blockRange(
      tenantId,
      dto.from,
      dto.to,
      dto.reason,
    );
    return { data: overrides, message: 'Días bloqueados' };
  }

  @Delete('schedule-overrides/:id')
  @UseGuards(ScheduleGuard)
  @ApiOperation({ summary: 'Delete a schedule override' })
  async deleteOverride(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    const result = await this.schedulesService.deleteOverride(tenantId, id);
    return { data: result, message: 'Excepción eliminada' };
  }
}
