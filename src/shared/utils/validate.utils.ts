// Libs
import { ForbiddenException } from '@nestjs/common';

import { IUserInfo, UserRole } from '../types';
import { handleErrorException } from './error.utils';
import { MESSAGES } from '../constants';
import { UserResponseDto } from '@app/apis/users/dtos';

// Overloads for typical resources: Post (authorId) and Comment (userId)
export const validateOwnerRole = <T extends object, K extends keyof T & string>(
  user: IUserInfo,
  data: T & Record<K, string>,
  field: K,
): true => {
  if (user.role !== UserRole.ADMIN && user.id !== data[field]) {
    handleErrorException({
      defaultMessage: MESSAGES.NO_PERMISSION,
      ExceptionClass: ForbiddenException,
    });
  }

  return true;
};

/**
 * Type guard ensuring a value is a valid `IUserInfo`.
 * Verifies the presence of required string identifiers to avoid unsafe object access.
 */
export const isValidUser = (data: unknown): data is Record<string, unknown> => {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  return typeof obj.id === 'string' && typeof obj.email === 'string';
};

/**
 * Type guard checking that an unknown payload satisfies `UserResponseDto`.
 * Confirms the DTO shape by validating that `data` is an object containing
 * a `data` array and a `meta` object, matching the pagination contract.
 */
export const isValidUserResponse = (data: unknown): data is UserResponseDto => {
  if (!data || typeof data !== 'object') {
    return false;
  }
  const obj = data as Record<string, unknown>;
  return Array.isArray(obj.data) && typeof obj.meta === 'object';
};


