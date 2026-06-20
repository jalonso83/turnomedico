import {
  IsArray,
  IsBoolean,
  IsInt,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  Min,
  Max,
  ValidateNested,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DayScheduleDto {
  @ApiProperty({ example: 1, description: '0=Sunday, 1=Monday ... 6=Saturday' })
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({ example: '08:00', description: 'HH:MM format' })
  @ValidateIf((o) => o.isActive)
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'startTime must be in HH:MM format' })
  startTime: string;

  @ApiProperty({ example: '17:00', description: 'HH:MM format' })
  @ValidateIf((o) => o.isActive)
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'endTime must be in HH:MM format' })
  endTime: string;

  @ApiProperty({ example: 30, description: 'Slot duration in minutes' })
  @ValidateIf((o) => o.isActive)
  @IsInt()
  @IsIn([15, 20, 30, 45, 60], { message: 'slotDurationMin must be 15, 20, 30, 45 or 60' })
  slotDurationMin: number;

  @ApiPropertyOptional({ example: '12:00', description: 'Break start HH:MM' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'breakStart must be in HH:MM format' })
  breakStart?: string;

  @ApiPropertyOptional({ example: '13:00', description: 'Break end HH:MM' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'breakEnd must be in HH:MM format' })
  breakEnd?: string;

  @ApiPropertyOptional({ example: 14, description: 'Max appointments allowed that day (null = unlimited)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  maxAppointments?: number | null;
}

export class UpdateScheduleDto {
  @ApiProperty({ type: [DayScheduleDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DayScheduleDto)
  schedules: DayScheduleDto[];
}
