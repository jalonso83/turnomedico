import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Datos NO clínicos del paciente que la secretaria puede editar.
 * (Los antecedentes médicos van por otro endpoint, solo para el doctor.)
 */
export class UpdatePatientBasicDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  cedula?: string | null;

  @ApiPropertyOptional({ description: 'Fecha de nacimiento (ISO o null)' })
  @IsOptional()
  @IsString()
  dateOfBirth?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10)
  gender?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string | null;

  @ApiPropertyOptional({ description: 'ID de la ARS del paciente' })
  @IsOptional()
  @IsString()
  insuranceId?: string | null;

  @ApiPropertyOptional({ description: 'Número de afiliado / contrato de la ARS' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  affiliateNumber?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isVip?: boolean;
}
