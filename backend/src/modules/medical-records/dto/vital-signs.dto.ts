import { IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Los campos enteros se guardan en columnas Int de la BD. El input numérico del
 * frontend puede llegar con decimales (ej. "72.5"); los redondeamos para no
 * rechazar todo el payload por validación ni romper el insert de Prisma.
 */
const roundInt = () =>
  Transform(({ value }) =>
    value === '' || value === null || value === undefined
      ? value
      : Math.round(Number(value)),
  );

export class UpsertVitalSignsDto {
  @ApiPropertyOptional({ example: 120, description: 'PA sistólica (mmHg)' })
  @IsOptional()
  @roundInt()
  @IsInt()
  @Min(40)
  @Max(300)
  bloodPressureSys?: number;

  @ApiPropertyOptional({ example: 80, description: 'PA diastólica (mmHg)' })
  @IsOptional()
  @roundInt()
  @IsInt()
  @Min(20)
  @Max(200)
  bloodPressureDia?: number;

  @ApiPropertyOptional({ example: 72, description: 'Frecuencia cardíaca (lpm)' })
  @IsOptional()
  @roundInt()
  @IsInt()
  @Min(20)
  @Max(250)
  heartRate?: number;

  @ApiPropertyOptional({ example: 16, description: 'Frecuencia respiratoria (rpm)' })
  @IsOptional()
  @roundInt()
  @IsInt()
  @Min(5)
  @Max(80)
  respiratoryRate?: number;

  @ApiPropertyOptional({ example: 36.7, description: 'Temperatura (°C)' })
  @IsOptional()
  @IsNumber()
  @Min(25)
  @Max(45)
  temperature?: number;

  @ApiPropertyOptional({ example: 70.5, description: 'Peso (kg)' })
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(500)
  weight?: number;

  @ApiPropertyOptional({ example: 170, description: 'Talla (cm)' })
  @IsOptional()
  @IsNumber()
  @Min(20)
  @Max(260)
  height?: number;

  @ApiPropertyOptional({ example: 98, description: 'Saturación O₂ (%)' })
  @IsOptional()
  @roundInt()
  @IsInt()
  @Min(50)
  @Max(100)
  oxygenSaturation?: number;
}
