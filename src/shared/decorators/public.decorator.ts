// libs
import { SetMetadata } from '@nestjs/common';

import { IS_PUBLIC, IS_ADMIN_ONLY } from '../common';

export const Public = () => SetMetadata(IS_PUBLIC, true);

export const AdminOnly = () => SetMetadata(IS_ADMIN_ONLY, true);
