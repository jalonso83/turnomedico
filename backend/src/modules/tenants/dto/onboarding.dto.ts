import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OnboardingDto {
  @ApiProperty({ example: 'Centro Médico San Rafael' })
  @IsString()
  @IsNotEmpty()
  consultorioName: string;

  @ApiProperty({ example: 'Av. Abraham Lincoln #302, Piantini' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiPropertyOptional({ example: 'Piso 3, Suite 302' })
  @IsString()
  @IsOptional()
  floor?: string;

  @ApiPropertyOptional({ example: 'Frente al parque Colón' })
  @IsString()
  @IsOptional()
  reference?: string;

  @ApiProperty({ example: 'Santo Domingo' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiPropertyOptional({ example: 'Piantini' })
  @IsString()
  @IsOptional()
  sector?: string;

  @ApiPropertyOptional({ example: 18.4861 })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({ example: -69.9312 })
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional({ example: 'ChIJN1t_tDeuEmsRUsoyG83frY4' })
  @IsString()
  @IsOptional()
  googlePlaceId?: string;
}
