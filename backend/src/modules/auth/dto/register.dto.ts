import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'Dr. Juan Garcia' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'dr.garcia@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: '+18091234567' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'Cardiología' })
  @IsString()
  @IsNotEmpty()
  specialty: string;

  @ApiProperty({ example: 'Santo Domingo' })
  @IsString()
  @IsNotEmpty()
  city: string;
}
