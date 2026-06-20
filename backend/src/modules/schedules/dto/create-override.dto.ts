import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOverrideDto {
  @ApiProperty({ example: '2026-04-15', description: 'ISO date string' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be in YYYY-MM-DD format' })
  date: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsBoolean()
  @IsOptional()
  isBlocked?: boolean;

  @ApiPropertyOptional({ example: 'Vacaciones' })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({ example: '10:00', description: 'Special hours start HH:MM' })
  @IsString()
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'startTime must be in HH:MM format' })
  startTime?: string;

  @ApiPropertyOptional({ example: '14:00', description: 'Special hours end HH:MM' })
  @IsString()
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'endTime must be in HH:MM format' })
  endTime?: string;
}
