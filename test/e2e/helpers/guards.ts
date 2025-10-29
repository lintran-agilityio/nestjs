import { ExecutionContext } from '@nestjs/common';
import { IUserInfo } from '@app/shared/types';
import { mockingUserInfo, mockUuidUser } from '@app/shared/mocks';

/**
 * Creates a mock JWT Guard that sets request.user when canActivate is called
 * This ensures GetCurrentUser decorator works in e2e tests
 */
export const createMockJwtGuard = (user?: Partial<IUserInfo>) => {
  const mockUser: IUserInfo = {
    id: mockUuidUser,
    ...mockingUserInfo,
    firstName: 'Lin',
    lastName: 'Tran',
    ...user,
  };

  return {
    canActivate: (context: ExecutionContext): boolean => {
      const request = context.switchToHttp().getRequest();
      request.user = mockUser;
      return true;
    },
  };
};

/**
 * Creates a mock Roles Guard
 */
export const createMockRolesGuard = () => ({
  canActivate: (): boolean => true,
});

/**
 * Creates a mock UserOwnershipProtected guard
 */
export const createMockOwnershipGuard = () => ({
  canActivate: (): boolean => true,
});

