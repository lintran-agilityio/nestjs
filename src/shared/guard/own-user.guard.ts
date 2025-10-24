// libs
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { UserRole } from '../types';

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
    console.log('Work in OwnUserGuard======>')
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    const paramId = request.params.id;

    if (!user) {
      throw new ForbiddenException('User not authentication');
    }

    if (user.id !== paramId) {
      throw new ForbiddenException('You can only modify your own account');
    }

    return true;
  }
}
