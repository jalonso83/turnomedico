import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReorderQueueDto {
  @ApiProperty({ example: '2026-08-12' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date debe tener formato YYYY-MM-DD' })
  date: string;

  @ApiProperty({
    type: [String],
    description: 'IDs de las citas en el orden deseado. Se les asigna 1..N.',
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(200)
  @IsString({ each: true })
  orderedIds: string[];
}

export class ConfirmDayDto {
  @ApiProperty({ example: '2026-08-12' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date debe tener formato YYYY-MM-DD' })
  date: string;
}

export class MarkNotifiedDto {
  @ApiProperty({ description: 'Texto que se le envió al paciente' })
  @IsString()
  @MaxLength(1000)
  content: string;
}

export enum DashboardReasonEnum {
  CONSULTATION = 'CONSULTATION',
  RESULTS_DELIVERY = 'RESULTS_DELIVERY',
  FOLLOW_UP = 'FOLLOW_UP',
}

/**
 * Agendar una cita futura desde el dashboard, para un paciente existente.
 * A diferencia de la reserva pública, aquí SÍ se permite FOLLOW_UP.
 */
export class CreateAppointmentDto {
  @ApiProperty({ description: 'Paciente ya registrado en el consultorio' })
  @IsString()
  patientId: string;

  @ApiProperty({ example: '2026-08-25' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date debe tener formato YYYY-MM-DD' })
  date: string;

  @ApiProperty({ enum: DashboardReasonEnum })
  @IsEnum(DashboardReasonEnum)
  reason: DashboardReasonEnum;

  @ApiPropertyOptional({ description: 'Consulta de la que sale este seguimiento' })
  @IsOptional()
  @IsString()
  parentAppointmentId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
