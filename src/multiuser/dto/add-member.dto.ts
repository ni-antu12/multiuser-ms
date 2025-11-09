import { IsString, IsEmail, IsOptional, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddMemberDto {
  @ApiProperty({
    description: 'RUT único del miembro (formato: 12345678-9)',
    example: '12345678-9'
  })
  @IsString()
  @Matches(/^\d{1,8}-[\dkK]$/, { message: 'RUT debe tener el formato válido (ej: 12345678-9)' })
  rut: string;

  @ApiProperty({
    description: 'Email único del miembro',
    example: 'miembro@ejemplo.com'
  })
  @IsEmail({}, { message: 'Email debe tener un formato válido' })
  email: string;

  @ApiPropertyOptional({
    description: 'Nombre del miembro',
    example: 'Juan'
  })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Apellido paterno del miembro',
    example: 'Pérez'
  })
  @IsString()
  @IsOptional()
  lastNamePaterno?: string;

  @ApiPropertyOptional({
    description: 'Apellido materno del miembro',
    example: 'González'
  })
  @IsString()
  @IsOptional()
  lastNameMaterno?: string;

  @ApiPropertyOptional({
    description: 'Teléfono de contacto',
    example: '+56912345678'
  })
  @IsString()
  @IsOptional()
  telefono?: string;
}
