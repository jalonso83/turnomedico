import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AppointmentStatusEnum {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  ARRIVED = 'ARRIVED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED_PATIENT = 'CANCELLED_PATIENT',
  CANCELLED_DOCTOR = 'CANCELLED_DOCTOR',
  NO_SHOW = 'NO_SHOW',
}

export class UpdateStatusDto {
  @ApiProperty({ enum: AppointmentStatusEnum, example: AppointmentStatusEnum.CONFIRMED })
  @IsEnum(AppointmentStatusEnum)
  status: AppointmentStatusEnum;

  @ApiPropertyOptional({ example: 'Patient requested cancellation' })
  @IsString()
  @IsOptional()
  cancelReason?: string;
}
