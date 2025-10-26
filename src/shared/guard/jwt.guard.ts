// libs
import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { firstValueFrom } from 'rxjs';

import { IS_PUBLIC_KEY } from '../common';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const result = super.canActivate(context);

    // Handle Promise result
    if (result instanceof Promise) {
      return await result;
    }

    // Handle Observable result
    if (typeof result === 'object' && 'subscribe' in result) {
      return await firstValueFrom(result);
    }

    return result;
  }
}
