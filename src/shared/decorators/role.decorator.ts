// Libs
import { SetMetadata } from '@nestjs/common';

import { UserRole } from '../types';
import { ROLES_KEY } from '../common';

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
