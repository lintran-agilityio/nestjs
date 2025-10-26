// Libs
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { UserRole } from '../types';
import { MESSAGES } from '../constants';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: UserRole;
  };
  params: {
    id: string;
  };
  body: any;
}

@Injectable()
export class OwnUserGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException(MESSAGES.UNAUTHORIZED);
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

    let targetId: string;

    if (ownershipField) {
      // Check ownership field in request body (for POST/PUT requests)
      targetId = request.body?.[ownershipField];

      // If not found in body, check URL params (for GET/DELETE requests)
      if (!targetId) {
        targetId = request.params?.[ownershipField] || request.params?.id;
      }
    } else {
      // Default behavior: check URL params id
      targetId = request.params?.id;
    }

    if (!targetId) {
      throw new ForbiddenException(MESSAGES.NO_PERMISSION);
    }

    // For USER role, check if the target ID matches their user ID
    if (user.role === UserRole.USER && user.id !== targetId) {
      throw new ForbiddenException(MESSAGES.NO_PERMISSION);
    }

    return true;
  }
}
