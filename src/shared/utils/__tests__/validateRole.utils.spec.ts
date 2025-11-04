import { ForbiddenException } from '@nestjs/common';
import { validateOwnerRole } from '../validateRole.utils';
import { IUserInfo, UserRole, UserStatus } from '@app/shared/types';
import { MESSAGES } from '@app/shared/constants';

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
