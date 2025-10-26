// Libs
import {
  CanActivate,
  Injectable,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { UserRole } from '../types';
import { ROLES_KEY } from '../common';
import { MESSAGES } from '../constants';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No roles specified, allow access
    if (!requiredRoles || !requiredRoles.length) return true;

    const { user } = context
      .switchToHttp()
      .getRequest<{ user?: { role?: UserRole } }>();

    if (!user) {
      throw new ForbiddenException(MESSAGES.UNAUTHORIZED);
    }

    if (!requiredRoles.some((role) => user.role === role)) {
      throw new ForbiddenException(MESSAGES.NO_PERMISSION);
    }

    return true;
  }
}
