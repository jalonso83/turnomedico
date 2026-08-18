import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Ver el porqué de los mensajes en español en `vital-signs.dto.ts`. */
const largo = (etiqueta: string, n: number) => ({
  message: `${etiqueta} no puede pasar de ${n} caracteres`,
});
const texto = (etiqueta: string) => ({ message: `${etiqueta} debe ser texto` });

export class PrescriptionItemDto {
  @ApiProperty({ example: 'Amoxicilina 500mg' })
  @IsString(texto('El medicamento'))
  @IsNotEmpty({ message: 'Cada renglón de la receta necesita el medicamento' })
  @MaxLength(200, largo('El medicamento', 200))
  drug: string;

  @ApiPropertyOptional({ example: '1 cápsula' })
  @IsOptional()
  @IsString(texto('La dosis'))
  @MaxLength(100, largo('La dosis', 100))
  dose?: string;

  @ApiPropertyOptional({ example: 'Cada 8 horas' })
  @IsOptional()
  @IsString(texto('La frecuencia'))
  @MaxLength(100, largo('La frecuencia', 100))
  frequency?: string;

  @ApiPropertyOptional({ example: '7 días' })
  @IsOptional()
  @IsString(texto('La duración'))
  @MaxLength(100, largo('La duración', 100))
  duration?: string;

  @ApiPropertyOptional({ example: 'Tomar con alimentos' })
  @IsOptional()
  @IsString(texto('Las indicaciones'))
  @MaxLength(300, largo('Las indicaciones', 300))
  instructions?: string;
}

export class UpsertPrescriptionDto {
  @ApiPropertyOptional({ type: [PrescriptionItemDto] })
  @IsOptional()
  @IsArray({ message: 'La receta debe ser una lista de medicamentos' })
  @ValidateNested({ each: true })
  @Type(() => PrescriptionItemDto)
  items?: PrescriptionItemDto[];

  @ApiPropertyOptional({ description: 'Indicaciones adicionales (texto libre)' })
  @IsOptional()
  @IsString(texto('Las indicaciones adicionales'))
  @MaxLength(2000, largo('Las indicaciones adicionales', 2000))
  notes?: string;
}
