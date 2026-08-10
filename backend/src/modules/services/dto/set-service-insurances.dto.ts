import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ServiceInsuranceTariffDto {
  @ApiProperty({ example: 'clx123abc', description: 'ID de la ARS' })
  @IsString()
  @IsNotEmpty()
  insuranceId: string;

  @ApiPropertyOptional({ example: 300, description: 'Efectivo que pone el paciente' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  patientCopay?: number | null;

  @ApiPropertyOptional({ example: 1200, description: 'Aporte de la ARS' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  insuranceCoverage?: number | null;
}

/**
 * Reemplaza el conjunto completo de tarifas del servicio.
 * Las ARS que no vengan en la lista quedan sin tarifa, es decir,
 * no cubren el servicio y lo paga completo el paciente.
 */
export class SetServiceInsurancesDto {
  @ApiProperty({ type: [ServiceInsuranceTariffDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceInsuranceTariffDto)
  tariffs: ServiceInsuranceTariffDto[];
}
