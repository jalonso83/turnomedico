import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Una cita y el número de turno que la secretaria le quiere dar. */
export class QueueAssignmentDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiPropertyOptional({
    description:
      'Número de turno pedido. Si se omite (o va null) el servidor le da el ' +
      'siguiente número libre, respetando el orden en que vienen los elementos.',
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(999)
  queuePosition?: number | null;
}

export class ReorderQueueDto {
  @ApiProperty({ example: '2026-08-12' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date debe tener formato YYYY-MM-DD' })
  date: string;

  /**
   * Forma nueva: la secretaria puede fijar el número de cada cita.
   * Se prefiere sobre `orderedIds` cuando viene.
   */
  @ApiPropertyOptional({ type: [QueueAssignmentDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => QueueAssignmentDto)
  items?: QueueAssignmentDto[];

  /**
   * Forma antigua: solo el orden, el servidor numera.
   * Se mantiene porque el frontend (Vercel) y el backend (Railway) se despliegan
   * por separado y durante unos minutos conviven versiones distintas.
   */
  @ApiPropertyOptional({
    type: [String],
    description: 'IDs en el orden deseado. Equivale a `items` sin número fijo.',
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(200)
  @IsString({ each: true })
  orderedIds?: string[];
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
