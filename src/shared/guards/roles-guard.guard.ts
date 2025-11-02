// Libs
import {
  CanActivate,
  Injectable,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { UserRole } from '../types';
import { MESSAGES, ROLES_KEY } from '../constants';
import { handleErrorException } from '../utils/error.utils';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
console.log('====== requiredRoles =====', requiredRoles)
    // No roles specified, allow access
    if (!requiredRoles || !requiredRoles.length) return true;

    const { user } = context
      .switchToHttp()
      .getRequest<{ user?: { role?: UserRole } }>();
console.log('====== user =====', user)
    if (!user) {
      handleErrorException({
        defaultMessage: MESSAGES.UNAUTHORIZED,
        ExceptionClass: ForbiddenException,
      });
    }

    if (!requiredRoles.some((role) => user.role === role)) {
      handleErrorException({
        defaultMessage: MESSAGES.NO_PERMISSION,
        ExceptionClass: ForbiddenException,
      });
    }

    return true;
  }
}
