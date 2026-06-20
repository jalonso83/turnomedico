import { IsEnum, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AppointmentReasonEnum {
  CONSULTATION = 'CONSULTATION',
  RESULTS_DELIVERY = 'RESULTS_DELIVERY',
}

export class BookAppointmentDto {
  @ApiProperty({ example: 'Maria Lopez' })
  @IsString()
  @IsNotEmpty()
  patientName: string;

  @ApiProperty({ example: '+5491155559876' })
  @IsString()
  @IsNotEmpty()
  patientPhone: string;

  @ApiProperty({ example: '2026-04-15' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be YYYY-MM-DD format' })
  date: string;

  @ApiProperty({ enum: AppointmentReasonEnum, example: AppointmentReasonEnum.CONSULTATION })
  @IsEnum(AppointmentReasonEnum, {
    message: 'reason debe ser CONSULTATION o RESULTS_DELIVERY',
  })
  reason: AppointmentReasonEnum;

  // Opcional: el modelo actual es "por turno" — el paciente no escoge hora.
  // Si el doctor quiere ofrecer horarios específicos, se puede mandar HH:mm.
  @ApiPropertyOptional({ example: '09:00' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'startTime must be HH:mm format' })
  startTime?: string;
}
