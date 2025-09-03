import { IsString, IsOptional, IsInt, Min, Max, Length, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFamilyGroupDto {
  @ApiPropertyOptional({
    description: 'UUID corto de 8 caracteres para el grupo familiar. Si no se proporciona, se generará automáticamente',
    example: 'aB3x9K2m',
    minLength: 8,
    maxLength: 8
  })
  @IsString()
  @IsOptional()
  @Length(8, 8)
  @Matches(/^[A-Za-z0-9]+$/, { message: 'UUID debe contener solo letras y números' })
  uuid?: string;

  @ApiProperty({
    description: 'UUID corto de 8 caracteres del usuario líder',
    example: 'nP7vQ8rT',
    minLength: 8,
    maxLength: 8
  })
  @IsString()
  @Length(8, 8)
  @Matches(/^[A-Za-z0-9]+$/, { message: 'Leader UUID debe contener solo letras y números' })
  leader: string;

  @ApiProperty({
    description: 'Token de la aplicación',
    example: 'token123'
  })
  @IsString()
  tokenApp: string;

  @ApiPropertyOptional({
    description: 'Número máximo de miembros permitidos (1-8)',
    example: 8,
    minimum: 1,
    maximum: 8,
    default: 8
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(8)
  maxMembers?: number;
}
