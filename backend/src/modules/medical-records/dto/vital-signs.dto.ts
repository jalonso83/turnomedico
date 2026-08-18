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

/**
 * Mensajes de validación en español.
 *
 * Sin esto, class-validator emite su texto por defecto en inglés
 * ("bloodPressureSys must not be less than 40") y eso es lo que terminaba
 * viendo el médico en pantalla, con el nombre técnico del campo incluido.
 *
 * El mensaje dice QUÉ campo y QUÉ rango se espera, que es lo único accionable:
 * "La presión sistólica debe estar entre 40 y 300 mmHg".
 */
const rango = (etiqueta: string, min: number, max: number, unidad: string) => ({
  min: { message: `${etiqueta} debe estar entre ${min} y ${max} ${unidad}` },
  max: { message: `${etiqueta} debe estar entre ${min} y ${max} ${unidad}` },
  tipo: { message: `${etiqueta} debe ser un número` },
});

const PA_SYS = rango('La presión sistólica', 40, 300, 'mmHg');
const PA_DIA = rango('La presión diastólica', 20, 200, 'mmHg');
const FC = rango('La frecuencia cardíaca', 20, 250, 'lpm');
const FR = rango('La frecuencia respiratoria', 5, 80, 'rpm');
const TEMP = rango('La temperatura', 25, 45, '°C');
const PESO = rango('El peso', 0.5, 500, 'kg');
const TALLA = rango('La talla', 20, 260, 'cm');
const SPO2 = rango('La saturación de oxígeno', 50, 100, '%');

export class UpsertVitalSignsDto {
  @ApiPropertyOptional({ example: 120, description: 'PA sistólica (mmHg)' })
  @IsOptional()
  @roundInt()
  @IsInt(PA_SYS.tipo)
  @Min(40, PA_SYS.min)
  @Max(300, PA_SYS.max)
  bloodPressureSys?: number;

  @ApiPropertyOptional({ example: 80, description: 'PA diastólica (mmHg)' })
  @IsOptional()
  @roundInt()
  @IsInt(PA_DIA.tipo)
  @Min(20, PA_DIA.min)
  @Max(200, PA_DIA.max)
  bloodPressureDia?: number;

  @ApiPropertyOptional({ example: 72, description: 'Frecuencia cardíaca (lpm)' })
  @IsOptional()
  @roundInt()
  @IsInt(FC.tipo)
  @Min(20, FC.min)
  @Max(250, FC.max)
  heartRate?: number;

  @ApiPropertyOptional({ example: 16, description: 'Frecuencia respiratoria (rpm)' })
  @IsOptional()
  @roundInt()
  @IsInt(FR.tipo)
  @Min(5, FR.min)
  @Max(80, FR.max)
  respiratoryRate?: number;

  @ApiPropertyOptional({ example: 36.7, description: 'Temperatura (°C)' })
  @IsOptional()
  @IsNumber({}, TEMP.tipo)
  @Min(25, TEMP.min)
  @Max(45, TEMP.max)
  temperature?: number;

  @ApiPropertyOptional({ example: 70.5, description: 'Peso (kg)' })
  @IsOptional()
  @IsNumber({}, PESO.tipo)
  @Min(0.5, PESO.min)
  @Max(500, PESO.max)
  weight?: number;

  @ApiPropertyOptional({ example: 170, description: 'Talla (cm)' })
  @IsOptional()
  @IsNumber({}, TALLA.tipo)
  @Min(20, TALLA.min)
  @Max(260, TALLA.max)
  height?: number;

  @ApiPropertyOptional({ example: 98, description: 'Saturación O₂ (%)' })
  @IsOptional()
  @roundInt()
  @IsInt(SPO2.tipo)
  @Min(50, SPO2.min)
  @Max(100, SPO2.max)
  oxygenSaturation?: number;
}
