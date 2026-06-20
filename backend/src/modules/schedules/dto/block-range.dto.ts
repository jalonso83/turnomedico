import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Bloquear un rango de días (ej. vacaciones) de una sola vez. */
export class BlockRangeDto {
  @ApiProperty({ example: '2026-07-01', description: 'Fecha inicial (YYYY-MM-DD)' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'from must be in YYYY-MM-DD format' })
  from: string;

  @ApiProperty({ example: '2026-07-15', description: 'Fecha final inclusiva (YYYY-MM-DD)' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'to must be in YYYY-MM-DD format' })
  to: string;

  @ApiPropertyOptional({ example: 'Vacaciones' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  reason?: string;
}
