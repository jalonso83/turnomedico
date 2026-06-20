import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStaffDto {
  @ApiProperty({ example: 'María Pérez' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'maria@consultorio.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Temporal123', description: 'Contraseña temporal que el doctor le entrega' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ example: '+18091234567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Puede editar el horario semanal del doctor',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  canManageSchedule?: boolean;
}
