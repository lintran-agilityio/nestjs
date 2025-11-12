// Libs
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import type { Request } from 'express';
import { UserRole } from '../types';
import { MESSAGES } from '../constants';
import { handleErrorException } from '../utils/error.utils';

type AuthenticatedRequest = Request<
  Record<string, string | undefined>,
  unknown,
  Record<string, unknown>
> & {
  user?: {
    id: string;
    role: UserRole;
  };
};

@Injectable()
export class OwnUserGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const { user, body, params } = request;

    if (!user) {
      handleErrorException({
        defaultMessage: MESSAGES.UNAUTHORIZED,
        ExceptionClass: ForbiddenException,
      });
    }

    // If user is ADMIN, allow access
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    // Get the ownership field from metadata
    const ownershipField = this.reflector.getAllAndOverride<string>(
      'ownershipField',
      [context.getHandler(), context.getClass()],
    );

    let targetId: string | undefined;

    if (ownershipField) {
      // Check ownership field in request body (for POST/PUT requests)
      const ownershipBodyField = body?.[ownershipField];
      if (typeof ownershipBodyField === 'string') {
        targetId = ownershipBodyField;
      }

      // If not found in body, check URL params (for GET/DELETE requests)
      if (!targetId) {
        const ownershipParamField = params?.[ownershipField];
        if (typeof ownershipParamField === 'string') {
          targetId = ownershipParamField;
        } else {
          const paramId = params?.id;
          if (typeof paramId === 'string') {
            targetId = paramId;
          }
        }
      }
    } else {
      // Default behavior: check URL params id
      const paramId = params?.id;
      if (typeof paramId === 'string') {
        targetId = paramId;
      }
    }

    if (!targetId) {
      handleErrorException({
        defaultMessage: MESSAGES.NO_PERMISSION,
        ExceptionClass: ForbiddenException,
      });
    }

    // For USER role, check if the target ID matches their user ID
    if (user.role === UserRole.USER && user.id !== targetId) {
      handleErrorException({
        defaultMessage: MESSAGES.NO_PERMISSION,
        ExceptionClass: ForbiddenException,
      });
    }

    return true;
  }
}
