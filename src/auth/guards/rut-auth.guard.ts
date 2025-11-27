import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RutAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Verificar si el endpoint está marcado como público
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const rut = request.headers['x-user-rut'] || request.headers['X-User-RUT'];

    if (!rut) {
      throw new BadRequestException(
        'El header X-User-RUT es requerido para identificar al usuario',
      );
    }

    // Validar formato básico de RUT
    const rutRegex = /^\d{1,8}-[\dkK]$/;
    if (!rutRegex.test(rut)) {
      throw new BadRequestException('Formato de RUT inválido');
    }

    // Buscar el usuario en la base de datos
    // Si no existe, el interceptor lo creará automáticamente
    const user = await this.prisma.user.findUnique({
      where: { rut },
      select: {
        uuid: true,
        rut: true,
        email: true,
        firstName: true,
        lastNamePaterno: true,
        lastNameMaterno: true,
        isActive: true,
        isLeader: true,
        familyGroupsUuid: true,
      },
    });

    // Agregar el usuario al request (puede ser null si no existe aún)
    // El interceptor se encargará de crearlo si no existe
    request.user = user || { rut }; // Al menos guardamos el RUT para que el interceptor lo use

    return true;
  }
}

