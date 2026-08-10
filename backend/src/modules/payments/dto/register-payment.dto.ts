import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PaymentItemKindEnum {
  CONSULTATION = 'CONSULTATION',
  SERVICE = 'SERVICE',
  OTHER = 'OTHER',
}

/**
 * Una línea de la factura. El servidor guarda `description` y `unitPrice`
 * como snapshot, así que cambiar el precio del catálogo después no altera
 * esta factura.
 */
export class PaymentItemDto {
  @ApiProperty({ enum: PaymentItemKindEnum })
  @IsEnum(PaymentItemKindEnum)
  kind: PaymentItemKindEnum;

  @ApiPropertyOptional({ description: 'Servicio del catálogo del que sale la línea' })
  @IsOptional()
  @IsString()
  serviceId?: string | null;

  @ApiProperty({ example: 'Electrocardiograma' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  description: string;

  @ApiProperty({ example: 1500 })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @ApiProperty({ description: 'Parte de esta línea que paga el paciente' })
  @IsNumber()
  @Min(0)
  cashAmount: number;

  @ApiPropertyOptional({ description: 'Parte de esta línea que aporta la ARS' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  insuranceAmount?: number;
}

export class RegisterPaymentDto {
  @ApiPropertyOptional({
    type: [PaymentItemDto],
    description:
      'Líneas de la factura. Si vienen, los totales se calculan a partir de ellas ' +
      'y se ignoran fee/cashAmount/insuranceAmount.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentItemDto)
  items?: PaymentItemDto[];

  // ── Camino legacy: un solo concepto (la consulta) ──────────────
  // Se conserva para no romper clientes viejos. Si no vienen `items`,
  // el servidor arma una única línea CONSULTATION con estos valores.

  @ApiPropertyOptional({ description: 'Tarifa de referencia de la consulta' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fee?: number;

  @ApiPropertyOptional({ description: 'Efectivo que paga el paciente' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cashAmount?: number;

  @ApiPropertyOptional({ description: 'Monto que aporta la ARS' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  insuranceAmount?: number;

  // ── Comunes ────────────────────────────────────────────────────

  @ApiPropertyOptional({ description: 'ID de la ARS (si la consulta lleva seguro)' })
  @IsOptional()
  @IsString()
  insuranceId?: string | null;

  @ApiPropertyOptional({ description: 'Consulta de cortesía (sin cobro)' })
  @IsOptional()
  @IsBoolean()
  isCourtesy?: boolean;

  @ApiPropertyOptional({ description: 'Nota administrativa del cobro' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
