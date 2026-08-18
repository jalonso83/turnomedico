import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/** Ver el porqué de los mensajes en español en `vital-signs.dto.ts`. */
const largo = (etiqueta: string) => ({
  message: `${etiqueta} no puede pasar de 5,000 caracteres`,
});
const texto = (etiqueta: string) => ({ message: `${etiqueta} debe ser texto` });

export class UpsertConsultationNoteDto {
  @ApiPropertyOptional({ description: 'S - Motivo / anamnesis' })
  @IsOptional()
  @IsString(texto('El motivo de consulta'))
  @MaxLength(5000, largo('El motivo de consulta'))
  subjective?: string;

  @ApiPropertyOptional({ description: 'O - Examen físico / hallazgos' })
  @IsOptional()
  @IsString(texto('El examen físico'))
  @MaxLength(5000, largo('El examen físico'))
  objective?: string;

  @ApiPropertyOptional({ description: 'A - Diagnóstico / impresión clínica' })
  @IsOptional()
  @IsString(texto('El diagnóstico'))
  @MaxLength(5000, largo('El diagnóstico'))
  assessment?: string;

  @ApiPropertyOptional({ description: 'P - Plan / indicaciones' })
  @IsOptional()
  @IsString(texto('El plan'))
  @MaxLength(5000, largo('El plan'))
  plan?: string;
}
