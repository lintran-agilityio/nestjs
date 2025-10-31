// Libs
import { SetMetadata } from '@nestjs/common';

import { IS_PUBLIC_KEY, IS_ADMIN_ONLY } from '../common';

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const AdminOnly = () => SetMetadata(IS_ADMIN_ONLY, true);
