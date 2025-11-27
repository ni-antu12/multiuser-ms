import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: string; // User UUID or ID
  rut?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  iat?: number;
  exp?: number;
  [key: string]: any; // Para campos adicionales del token
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // La clave secreta debe venir del servicio de autenticación
      // Por ahora usamos una variable de entorno o un valor por defecto
      secretOrKey: process.env.JWT_SECRET || configService.get<string>('JWT_SECRET') || 'your-secret-key-change-in-production',
    });
  }

  async validate(payload: JwtPayload) {
    // Validar que el payload tenga la información mínima necesaria
    if (!payload.sub) {
      throw new UnauthorizedException('Token inválido: falta identificador de usuario');
    }

    // Retornar el payload que se agregará al request como `user`
    return {
      uuid: payload.sub,
      rut: payload.rut,
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      ...payload, // Incluir cualquier otro campo del token
    };
  }
}
