import type { LoggerService } from '@nestjs/common';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import {
  validateOwnerRole,
  isValidUser,
  isValidUserResponse,
  validOwnerShip,
  validHashingRefreshToken,
  isValidUserCache,
  validateCacheEmail,
} from '@app/shared/utils/validate.utils';
import type { HashingAbstractService } from '@app/shared/modules/hashing/hashing.abstract.service';
import type { CacheAbstractService } from '@app/shared/modules/cache/cache.abstract.service';
import { User } from '@app/apis/users/entities';
import { IUserInfo, UserRole, UserStatus } from '@app/shared/types';
import { MESSAGES, REDIS_CACHE_KEYS } from '@app/shared/constants';
import { UserResponseDto } from '@app/apis/users/dtos';

describe('validateOwnerRole', () => {
  const makeUser = (overrides: Partial<IUserInfo> = {}): IUserInfo => {
    return {
      id: 'user-1',
      email: 'user@example.com',
      firstName: 'First',
      lastName: 'Last',
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      ...overrides,
    } as IUserInfo;
  };

  it('returns true when user is ADMIN regardless of ownership', () => {
    const admin = makeUser({ id: 'admin-1', role: UserRole.ADMIN });
    const data = { userId: 'someone-else' };

    const result = validateOwnerRole(admin, data, 'userId');
    expect(result).toBe(true);
  });

  it('returns true when user is the owner (ids match)', () => {
    const user = makeUser({ id: 'owner-1', role: UserRole.USER });
    const data = { userId: 'owner-1' };

    const result = validateOwnerRole(user, data, 'userId');
    expect(result).toBe(true);
  });

  it('throws ForbiddenException when non-admin and ids do not match', () => {
    const user = makeUser({ id: 'user-1', role: UserRole.USER });
    const data = { userId: 'different-user' };

    expect(() => validateOwnerRole(user, data, 'userId')).toThrow(
      ForbiddenException,
    );

    try {
      validateOwnerRole(user, data, 'userId');
    } catch (err) {
      expect(err).toBeInstanceOf(ForbiddenException);
      const response = (err as ForbiddenException).getResponse() as any;
      expect(response.message).toBe(MESSAGES.NO_PERMISSION);
      expect(response.status).toBe(403);
    }
  });

  it('works with post shape using authorId', () => {
    const user = makeUser({ id: 'author-1', role: UserRole.USER });
    const existedPost = { authorId: 'author-1' };

    const result = validateOwnerRole(user, existedPost, 'authorId');
    expect(result).toBe(true);
  });
});

describe('isValidUser', () => {
  const baseUser: IUserInfo = {
    id: 'user-1',
    email: 'user@example.com',
    firstName: 'First',
    lastName: 'Last',
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
  };

  it('returns true for a well-formed IUserInfo object', () => {
    expect(isValidUser(baseUser)).toBe(true);
  });

  it('returns false when required identifiers are missing', () => {
    expect(
      isValidUser({
        ...baseUser,
        email: undefined as unknown as string,
      }),
    ).toBe(false);
  });

  it('returns false for null or non-object values', () => {
    expect(isValidUser(null)).toBe(false);
    expect(isValidUser('not-user' as unknown as IUserInfo)).toBe(false);
  });
});

describe('isValidUserResponse', () => {
  const makeResponse = (overrides: Partial<UserResponseDto> = {}) =>
    ({
      data: [],
      meta: {},
      ...overrides,
    }) as unknown as UserResponseDto;

  it('returns true for object containing data array and meta object', () => {
    expect(isValidUserResponse(makeResponse())).toBe(true);
  });

  it('returns false when data is not an array', () => {
    expect(
      isValidUserResponse(
        makeResponse({ data: 'invalid' as unknown as any[] }),
      ),
    ).toBe(false);
  });

  it('returns false when meta is not an object', () => {
    expect(
      isValidUserResponse(makeResponse({ meta: null as unknown as any })),
    ).toBe(false);
  });

  it('returns false for null and primitive values', () => {
    expect(isValidUserResponse(null)).toBe(false);
    expect(isValidUserResponse('not-response')).toBe(false);
  });
});

describe('validOwnerShip', () => {
  const baseUser: IUserInfo = {
    id: 'user-123',
    email: 'user@example.com',
    firstName: 'First',
    lastName: 'Last',
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
  };

  const makeLogger = () => ({ error: jest.fn() });

  it('returns early when no current user is provided', () => {
    const logger = makeLogger();

    expect(() =>
      validOwnerShip({
        currentUser: undefined,
        value: 'user-123',
        field: 'id',
        logger,
      }),
    ).not.toThrow();

    expect(logger.error).not.toHaveBeenCalled();
  });

  it('allows admins to proceed without logging', () => {
    const logger = makeLogger();
    const adminUser = { ...baseUser, role: UserRole.ADMIN };

    expect(() =>
      validOwnerShip({
        currentUser: adminUser,
        value: 'any-id',
        field: 'id',
        logger,
      }),
    ).not.toThrow();

    expect(logger.error).not.toHaveBeenCalled();
  });

  it('throws ForbiddenException and logs when user does not own the resource', () => {
    const logger = makeLogger();

    expect(() =>
      validOwnerShip({
        currentUser: baseUser,
        value: 'different-user',
        field: 'id',
        logger,
      }),
    ).toThrow(ForbiddenException);

    expect(logger.error).toHaveBeenCalledWith(
      'User user-123 attempted to access id different-user',
    );
  });

  it('does not error when user owns the resource via email', () => {
    const logger = makeLogger();

    expect(() =>
      validOwnerShip({
        currentUser: baseUser,
        value: baseUser.email,
        field: 'email',
        logger,
      }),
    ).not.toThrow();

    expect(logger.error).not.toHaveBeenCalled();
  });
});

describe('isValidUserCache', () => {
  const cacheKey = 'user-cache-key';

  const makeDeps = () => {
    const cacheService: jest.Mocked<
      Pick<CacheAbstractService, 'getKey' | 'deleteKey'>
    > = {
      getKey: jest.fn(),
      deleteKey: jest.fn(),
    };

    const logger: jest.Mocked<Pick<LoggerService, 'log' | 'error'>> = {
      log: jest.fn(),
      error: jest.fn(),
    };

    return { cacheService, logger };
  };

  it('returns user instance from cache when payload is valid', async () => {
    const { cacheService, logger } = makeDeps();
    const cachedPayload = { id: 'user-123', email: 'cached@example.com' };
    cacheService.getKey.mockResolvedValue(cachedPayload);

    const result = await isValidUserCache({
      cacheKey,
      cacheService,
      logger,
      identifier: 'email',
      entity: User,
      validator: isValidUser,
    });

    expect(result).toBeInstanceOf(User);
    expect(result?.id).toBe('user-123');
    expect(logger.log).toHaveBeenCalledWith('User by email served from cache');
    expect(cacheService.deleteKey).not.toHaveBeenCalled();
  });

  it('evicts invalid cache entries and returns null', async () => {
    const { cacheService, logger } = makeDeps();
    cacheService.getKey.mockResolvedValue({ some: 'invalid' });

    const result = await isValidUserCache({
      cacheKey,
      cacheService,
      logger,
      identifier: 'email',
      entity: User,
      validator: isValidUser,
    });

    expect(result).toBeNull();
    expect(logger.error).toHaveBeenCalledWith(
      `Cached user data for key ${cacheKey} is invalid. Clearing cache.`,
    );
    expect(cacheService.deleteKey).toHaveBeenCalledWith(cacheKey);
  });

  it('returns null without logging when cache is empty', async () => {
    const { cacheService, logger } = makeDeps();
    cacheService.getKey.mockResolvedValue(null);

    const result = await isValidUserCache({
      cacheKey,
      cacheService,
      logger,
      entity: User,
      validator: isValidUser,
    });

    expect(result).toBeNull();
    expect(logger.log).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
    expect(cacheService.deleteKey).not.toHaveBeenCalled();
  });
});

describe('validateCacheEmail', () => {
  const emailUpdated = 'new@example.com';
  const prevEmail = 'old@example.com';

  const makeDeps = () => {
    const cacheService: jest.Mocked<Pick<CacheAbstractService, 'deleteKey'>> = {
      deleteKey: jest.fn(),
    };

    const logger: jest.Mocked<Pick<LoggerService, 'error'>> = {
      error: jest.fn(),
    };

    return { cacheService, logger };
  };

  it('clears both previous and updated email cache entries when email changes', async () => {
    const { cacheService, logger } = makeDeps();

    await validateCacheEmail({
      emailUpdated,
      prevEmail,
      cacheService,
      logger,
    });

    expect(cacheService.deleteKey).toHaveBeenNthCalledWith(
      1,
      `${REDIS_CACHE_KEYS.USERS.BY_EMAIL}:${prevEmail}`,
    );
    expect(cacheService.deleteKey).toHaveBeenNthCalledWith(
      2,
      `${REDIS_CACHE_KEYS.USERS.BY_EMAIL}:${emailUpdated}`,
    );
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('skips deleting updated email when unchanged', async () => {
    const { cacheService, logger } = makeDeps();

    await validateCacheEmail({
      emailUpdated: prevEmail,
      prevEmail,
      cacheService,
      logger,
    });

    expect(cacheService.deleteKey).toHaveBeenCalledTimes(1);
    expect(cacheService.deleteKey).toHaveBeenCalledWith(
      `${REDIS_CACHE_KEYS.USERS.BY_EMAIL}:${prevEmail}`,
    );
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('logs an error when cache deletion fails', async () => {
    const { cacheService, logger } = makeDeps();
    const failure = new Error('redis offline');
    cacheService.deleteKey.mockRejectedValueOnce(failure);

    await validateCacheEmail({
      emailUpdated,
      prevEmail,
      cacheService,
      logger,
    });

    expect(logger.error).toHaveBeenCalledWith(
      `[Cache] - Failed to invalidate email cache in updateById: ${JSON.stringify(
        failure,
      )}`,
    );
  });
});

describe('validHashingRefreshToken', () => {
  const makeDeps = () => {
    const hashingService: jest.Mocked<Pick<HashingAbstractService, 'compare'>> =
      {
        compare: jest.fn<
          ReturnType<HashingAbstractService['compare']>,
          Parameters<HashingAbstractService['compare']>
        >(),
      };

    const logger: jest.Mocked<Pick<LoggerService, 'error'>> = {
      error: jest.fn(),
    };

    return { hashingService, logger };
  };

  it('does nothing when hashes match', async () => {
    const { hashingService, logger } = makeDeps();
    hashingService.compare.mockResolvedValue(true);

    await expect(
      validHashingRefreshToken({
        token: 'raw-token',
        refreshToken: 'hashed-token',
        hashingService,
        logger,
      }),
    ).resolves.toBeUndefined();

    expect(hashingService.compare).toHaveBeenCalledWith(
      'raw-token',
      'hashed-token',
    );
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('logs and throws UnauthorizedException when hashes do not match', async () => {
    const { hashingService, logger } = makeDeps();
    hashingService.compare.mockResolvedValue(false);

    await expect(
      validHashingRefreshToken({
        token: 'raw-token',
        refreshToken: 'invalid-hash',
        hashingService,
        logger,
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(logger.error).toHaveBeenCalledWith('Invalid refresh token attempt.');

    try {
      await validHashingRefreshToken({
        token: 'raw-token',
        refreshToken: 'invalid-hash',
        hashingService,
        logger,
      });
    } catch (err) {
      expect(err).toBeInstanceOf(UnauthorizedException);
      const response = (err as UnauthorizedException).getResponse() as any;
      expect(response.message).toBe(MESSAGES.USER_INVALID_REFRESH_TOKEN);
      expect(response.status).toBe(401);
    }
  });
});
