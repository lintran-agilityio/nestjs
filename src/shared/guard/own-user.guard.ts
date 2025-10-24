// libs
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
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
}

@Injectable()
export class OwnUserGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    const paramId = request.params.id;

    if (!user) {
      throw new ForbiddenException(MESSAGES.UNAUTHORIZED);
    }

    if (user.role === UserRole.USER && user.id !== paramId) {
      throw new ForbiddenException(MESSAGES.NO_PERMISSION);
    }

    return true;
  }
}
