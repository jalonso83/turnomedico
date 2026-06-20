import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateStaffDto {
  @ApiPropertyOptional({ example: 'María Pérez' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '+18091234567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Puede editar el horario semanal del doctor' })
  @IsOptional()
  @IsBoolean()
  canManageSchedule?: boolean;

  @ApiPropertyOptional({ description: 'Activar/desactivar la cuenta de la secretaria' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Nueva contraseña (reset por el doctor)' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}
