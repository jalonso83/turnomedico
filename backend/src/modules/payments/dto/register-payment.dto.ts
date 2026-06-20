import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterPaymentDto {
  @ApiPropertyOptional({ description: 'Tarifa de referencia de la consulta' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fee?: number;

  @ApiPropertyOptional({ description: 'Efectivo que paga el paciente' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cashAmount?: number;

  @ApiPropertyOptional({ description: 'ID de la ARS (si la consulta lleva seguro)' })
  @IsOptional()
  @IsString()
  insuranceId?: string | null;

  @ApiPropertyOptional({ description: 'Monto que aporta la ARS' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  insuranceAmount?: number;

  @ApiPropertyOptional({ description: 'Consulta de cortesía (sin cobro)' })
  @IsOptional()
  @IsBoolean()
  isCourtesy?: boolean;

  @ApiPropertyOptional({ description: 'Nota administrativa del cobro' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
