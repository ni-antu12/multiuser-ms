import { IsEmail, IsString, IsOptional, MinLength, IsBoolean, Length, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiPropertyOptional({
    description: 'UUID corto de 8 caracteres para el usuario. Si no se proporciona, se generará automáticamente',
    example: 'nP7vQ8rT',
    minLength: 8,
    maxLength: 8
  })
  @IsString()
  @IsOptional()
  @Length(8, 8)
  @Matches(/^[A-Za-z0-9]+$/, { message: 'UUID debe contener solo letras y números' })
  uuid?: string;

  @ApiProperty({
    description: 'RUT único del usuario (formato: 12345678-9)',
    example: '12345678-9'
  })
  @IsString()
  @Matches(/^\d{1,8}-[\dkK]$/, { message: 'RUT debe tener el formato válido (ej: 12345678-9)' })
  rut: string;

  @ApiProperty({
    description: 'UUID corto de 8 caracteres del grupo familiar',
    example: 'aB3x9K2m',
    minLength: 8,
    maxLength: 8
  })
  @IsString()
  @Length(8, 8)
  @Matches(/^[A-Za-z0-9]+$/, { message: 'Family Group UUID debe contener solo letras y números' })
  familyGroupsUuid: string;

  @ApiProperty({
    description: 'Email único del usuario',
    example: 'usuario@ejemplo.com'
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Nombre de usuario único',
    example: 'usuario1',
    minLength: 3
  })
  @IsString()
  @MinLength(3)
  username: string;

  @ApiProperty({
    description: 'Contraseña del usuario (mínimo 6 caracteres)',
    example: 'password123',
    minLength: 6
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({
    description: 'Nombre del usuario',
    example: 'Juan'
  })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Apellido del usuario',
    example: 'Pérez'
  })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Estado activo del usuario',
    example: true,
    default: true
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Indica si el usuario es líder del grupo familiar',
    example: false,
    default: false
  })
  @IsBoolean()
  @IsOptional()
  isLeader?: boolean;
}
