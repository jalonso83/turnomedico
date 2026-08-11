import { IsNumber, IsOptional, IsString, Matches, MaxLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CloseCashDto {
  @ApiProperty({ example: '2026-08-10' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date debe tener formato YYYY-MM-DD' })
  date: string;

  @ApiProperty({ description: 'Efectivo contado en la gaveta', example: 5400 })
  @IsNumber()
  @Min(0)
  cashCounted: number;

  @ApiPropertyOptional({ description: 'Explicación del descuadre, si lo hubo' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
