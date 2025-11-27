import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MultiuserService } from '../../multiuser/multiuser.service';

@Injectable()
export class EnsureFamilyGroupInterceptor implements NestInterceptor {
  constructor(private multiuserService: MultiuserService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Si hay un usuario autenticado, asegurar que tenga grupo familiar
    if (user && user.rut) {
      try {
        await this.multiuserService.ensureFamilyGroupForUser({
          rut: user.rut,
          email: user.email,
          firstName: user.firstName,
          lastNamePaterno: user.lastName,
          lastNameMaterno: user.lastNameMaterno,
        });
      } catch (error) {
        // Si hay error, lo dejamos pasar (puede ser que ya existe, etc.)
        console.warn('Error al asegurar grupo familiar:', error.message);
      }
    }

    return next.handle();
  }
}

