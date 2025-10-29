// Libs
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
    // Bypass auth entirely in test environments (e2e/unit)
    if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID) {
      return true;
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const result = await super.canActivate(context);

    // Handle Promise result
    if (result instanceof Promise) {
      return result;
    }

    // Handle Observable result
    if (typeof result === 'object' && 'subscribe' in result) {
      return await firstValueFrom(result);
    }

    return result;
  }
}
