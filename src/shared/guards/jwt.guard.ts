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
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const result = await super.canActivate(context);

    console.log('result: ', result);
    console.log('======');

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
