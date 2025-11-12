// Libs
import { ForbiddenException } from '@nestjs/common';

import { IUserInfo, UserRole, ValidOwnerShipParamsType } from '../types';
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
  const meta = obj.meta;
  return Array.isArray(obj.data) && typeof meta === 'object' && meta !== null;
};

/**
 * Ensures the authenticated user owns the requested resource or has admin privileges.
 * Logs the unauthorized attempt before delegating to `handleErrorException` to raise a 403.
 *
 * @throws ForbiddenException when a non-admin user attempts to access another user's resource.
 */
export const validOwnerShip = ({
  currentUser,
  value,
  field,
  logger,
}: ValidOwnerShipParamsType) => {
  if (!currentUser || currentUser.role === UserRole.ADMIN) return;

  const ownsResource =
    (field === 'id' && currentUser.id === value) ||
    (field === 'email' && currentUser.email === value);

  if (!ownsResource) {
    logger.error(
      `User ${currentUser.id} attempted to access ${field} ${value}`,
    );
    handleErrorException({
      defaultMessage: MESSAGES.NO_PERMISSION,
      ExceptionClass: ForbiddenException,
    });
  }
};
