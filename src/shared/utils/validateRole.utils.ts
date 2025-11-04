// Libs
import { ForbiddenException } from '@nestjs/common';

import { IUserInfo, UserRole } from '../types';
import { handleErrorException } from './error.utils';
import { MESSAGES } from '../constants';

// Overloads for typical resources: Post (authorId) and Comment (userId)
export function validateOwnerRole<T extends object, K extends keyof T & string>(
  user: IUserInfo,
  data: T & Record<K, string>,
  field: K,
): true {
  if (user.role !== UserRole.ADMIN && user.id !== data[field]) {
    handleErrorException({
      defaultMessage: MESSAGES.NO_PERMISSION,
      ExceptionClass: ForbiddenException,
    });
  }

  return true;
}
