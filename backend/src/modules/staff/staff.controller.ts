import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { StaffService } from './staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';

@ApiTags('Dashboard - Staff (Secretarias)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Roles('DOCTOR') // Solo el doctor gestiona a sus secretarias
@Controller('dashboard/staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get()
  @ApiOperation({ summary: 'Listar secretarias del consultorio' })
  async list(@CurrentTenant() tenantId: string) {
    return this.staffService.list(tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Crear una secretaria' })
  async create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateStaffDto,
  ) {
    return this.staffService.create(tenantId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar permisos/estado de una secretaria' })
  async update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateStaffDto,
  ) {
    return this.staffService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desactivar una secretaria' })
  async remove(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.staffService.remove(tenantId, id);
  }
}
