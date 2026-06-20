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

export class PrescriptionItemDto {
  @ApiProperty({ example: 'Amoxicilina 500mg' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  drug: string;

  @ApiPropertyOptional({ example: '1 cápsula' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  dose?: string;

  @ApiPropertyOptional({ example: 'Cada 8 horas' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  frequency?: string;

  @ApiPropertyOptional({ example: '7 días' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  duration?: string;

  @ApiPropertyOptional({ example: 'Tomar con alimentos' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  instructions?: string;
}

export class UpsertPrescriptionDto {
  @ApiPropertyOptional({ type: [PrescriptionItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrescriptionItemDto)
  items?: PrescriptionItemDto[];

  @ApiPropertyOptional({ description: 'Indicaciones adicionales (texto libre)' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
