import { ForbiddenException } from '@nestjs/common';
import {
  validateOwnerRole,
  isValidUser,
  isValidUserResponse,
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
        // @ts-expect-error simulate missing email
        email: undefined,
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
