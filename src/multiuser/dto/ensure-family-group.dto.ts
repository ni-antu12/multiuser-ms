import { IsString, IsOptional, IsEmail, Length, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EnsureFamilyGroupDto {
  @ApiProperty({
    description: 'RUT del usuario autenticado',
    example: '12345678-9'
  })
  @IsString()
  @Length(9, 12)
  @Matches(/^\d{1,8}-[\dkK]$/, { message: 'RUT debe tener el formato válido (ej: 12345678-9)' })
  rut: string;

  @ApiPropertyOptional({
    description: 'Correo del usuario (se usa si se crea por primera vez)',
    example: 'user@ejemplo.com'
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Nombre del usuario', example: 'Juan' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ description: 'Apellido paterno', example: 'Pérez' })
  @IsOptional()
  @IsString()
  lastNamePaterno?: string;

  @ApiPropertyOptional({ description: 'Apellido materno', example: 'González' })
  @IsOptional()
  @IsString()
  lastNameMaterno?: string;
}

