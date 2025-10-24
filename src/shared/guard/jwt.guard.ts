// libs
import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

import { IS_PUBLIC_KEY } from '../common';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    console.log('====== JWT PUBLIC ======', isPublic)
    if (isPublic) return true;
    
    const result = super.canActivate(context);
    console.log('======= JWT CONTEXT', result)
    
    // Handle Promise result properly
    if (result instanceof Promise) {
      return result.catch((error) => {
        console.log('JWT Authentication failed:', error.message);
        throw error;
      });
    }
    
    return result;
  }
}
