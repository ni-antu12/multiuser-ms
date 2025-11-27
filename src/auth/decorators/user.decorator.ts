import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface UserFromToken {
  uuid: string;
  rut?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  [key: string]: any;
}

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext): UserFromToken | any => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return null;
    }

    // Si se especifica un campo específico, retornarlo
    return data ? user[data] : user;
  },
);

