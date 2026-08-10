import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
