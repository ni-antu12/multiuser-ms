import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { MultiuserService } from '../../multiuser/multiuser.service';

@Injectable()
export class EnsureFamilyGroupFromRutInterceptor implements NestInterceptor {
  constructor(private multiuserService: MultiuserService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const rut = user?.rut || request.headers['x-user-rut'] || request.headers['X-User-RUT'];

    // Si hay un RUT, asegurar que el usuario tenga grupo familiar
    // Esto creará el usuario si no existe y su grupo familiar
    if (rut) {
      try {
        const result = await this.multiuserService.ensureFamilyGroupForUser({
          rut,
          email: user?.email,
          firstName: user?.firstName,
          lastNamePaterno: user?.lastNamePaterno,
          lastNameMaterno: user?.lastNameMaterno,
        });
        
        // Actualizar el usuario en el request con la información actualizada
        request.user = result.user;
      } catch (error) {
        // Si hay error, lo dejamos pasar (puede ser que ya existe, etc.)
        console.warn('Error al asegurar grupo familiar:', error.message);
      }
    }

    return next.handle();
  }
}

