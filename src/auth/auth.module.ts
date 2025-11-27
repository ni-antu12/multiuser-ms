import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        // No necesitamos configurar signing aquí ya que solo validamos
        // pero podríamos necesitar la clave para validar
        secret: process.env.JWT_SECRET || configService.get<string>('JWT_SECRET') || 'your-secret-key-change-in-production',
        signOptions: {
          // Solo validamos, no firmamos tokens aquí
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [JwtStrategy],
  exports: [PassportModule, JwtModule],
})
export class AuthModule {}

