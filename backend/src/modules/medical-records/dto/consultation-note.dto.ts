import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpsertConsultationNoteDto {
  @ApiPropertyOptional({ description: 'S - Motivo / anamnesis' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  subjective?: string;

  @ApiPropertyOptional({ description: 'O - Examen físico / hallazgos' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  objective?: string;

  @ApiPropertyOptional({ description: 'A - Diagnóstico / impresión clínica' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  assessment?: string;

  @ApiPropertyOptional({ description: 'P - Plan / indicaciones' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  plan?: string;
}
