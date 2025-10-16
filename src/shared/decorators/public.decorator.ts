// libs
import { SetMetadata } from '@nestjs/common';

import { IS_USER_PUBLIC, IS_ADMIN_ONLY } from '../common';

export const Public = () => SetMetadata(IS_USER_PUBLIC, true);

export const AdminOnly = () => SetMetadata(IS_ADMIN_ONLY, true);
