// Libs
import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';

import { OwnUserGuard } from './own-user.guard';
import { RolesGuard } from './roles-guard.guard';
import { JwtAuthGuard } from './jwt.guard';
import { UserRole } from '../types';

/**
 * Combines JwtAuthGuard, RolesGuard, and OwnUserGuard
 * into a single decorator for cleaner controllers.
 */
export const UserOwnershipProtected = (
  field: string = 'id',
  roles: UserRole[] = [UserRole.ADMIN],
) => {
  return applyDecorators(
    SetMetadata('roles', roles),
    SetMetadata('ownershipField', field),
    UseGuards(JwtAuthGuard, RolesGuard, OwnUserGuard),
  );
};
