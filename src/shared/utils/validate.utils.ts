// Libs
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';

import type {
  IUserInfo,
  ValidHashingRefreshTokenParamsType,
  ValidOwnerShipParamsType,
  ValidUserCacheParamsType,
  ValidateCacheEmailParamsType,
} from '../types';
import { UserRole } from '../types';
import { handleErrorException } from './error.utils';
import { MESSAGES, REDIS_CACHE_KEYS } from '../constants';
import { UserResponseDto } from '@app/apis/users/dtos';
import { plainToInstance } from 'class-transformer';

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
 * Validates that the cached payload for a given key represents a proper user shape.
 * Returns the hydrated entity instance when the cache is trustworthy, otherwise evicts it.
 */
export const isValidUserCache = async <T extends object>({
  cacheKey,
  cacheService,
  logger,
  identifier = 'id',
  entity,
  validator,
}: ValidUserCacheParamsType<T>): Promise<T | null> => {
  const cached = await cacheService.getKey<Record<string, unknown>>(cacheKey);

  if (!cached) {
    return null;
  }

  if (validator(cached)) {
    logger.log(`User by ${identifier} served from cache`);
    return plainToInstance(entity, cached);
  }

  logger.error(
    `Cached user data for key ${cacheKey} is invalid. Clearing cache.`,
  );
  await cacheService.deleteKey(cacheKey);
  return null;
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

/**
 * Validates that the persisted hashed refresh token matches the raw token received.
 * Logs the suspicious attempt and raises `UnauthorizedException` when the tokens diverge.
 *
 * @throws UnauthorizedException when hash comparison fails.
 */
export const validHashingRefreshToken = async ({
  token,
  refreshToken,
  hashingService,
  logger,
}: ValidHashingRefreshTokenParamsType): Promise<void> => {
  const isValid = await hashingService.compare(token, refreshToken);

  if (!isValid) {
    logger.error(`Invalid refresh token attempt.`);
    handleErrorException({
      defaultMessage: MESSAGES.USER_INVALID_REFRESH_TOKEN,
      ExceptionClass: UnauthorizedException,
    });
  }
};

/**
 * Removes stale user email cache entries for the previous and newly provided email.
 * Ensures subsequent reads do not return outdated user profiles.
 */
export const validateCacheEmail = async ({
  emailUpdated,
  prevEmail,
  cacheService,
  logger,
  cachedForFunctionName = 'updateById',
}: ValidateCacheEmailParamsType): Promise<void> => {
  const { BY_EMAIL } = REDIS_CACHE_KEYS.USERS;
  try {
    if (prevEmail) {
      await cacheService.deleteKey(`${BY_EMAIL}:${prevEmail}`);
    }

    if (emailUpdated && emailUpdated !== prevEmail) {
      await cacheService.deleteKey(`${BY_EMAIL}:${emailUpdated}`);
    }
  } catch (cacheErr) {
    logger.error(
      `[Cache] - Failed to invalidate email cache in ${cachedForFunctionName}: ${JSON.stringify(cacheErr)}`,
    );
  }
};
