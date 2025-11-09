import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MinLength } from 'class-validator';

export class PatientLoginDto {
  @ApiProperty({ example: '12345678-9', description: 'RUT del paciente' })
  @IsString()
  @Matches(/^\d{1,8}-[\dkK]$/, { message: 'RUT debe tener el formato válido (ej: 12345678-9)' })
  rut: string;

  @ApiProperty({ example: 'demo123', description: 'Contraseña del paciente' })
  @IsString()
  @MinLength(4)
  password: string;
}

