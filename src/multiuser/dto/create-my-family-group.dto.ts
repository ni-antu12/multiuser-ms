import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMyFamilyGroupDto {
  @ApiPropertyOptional({
    description: 'Token personalizado de la aplicación. Si no se proporciona, se genera automáticamente',
    example: 'mi_token_personalizado'
  })
  @IsOptional()
  @IsString()
  tokenApp?: string;
}

