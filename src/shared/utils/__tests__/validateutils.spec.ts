import { ForbiddenException } from '@nestjs/common';
import {
  validateOwnerRole,
  isValidUser,
  isValidUserResponse,
  validOwnerShip,
} from '../validate.utils';
import { IUserInfo, UserRole, UserStatus } from '@app/shared/types';
import { MESSAGES } from '@app/shared/constants';
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
