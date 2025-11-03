import { User } from '@app/apis/users/entities';
import { UserRole, UserStatus } from '@app/shared/types';

export const mockingUserInfo = {
  email: 'lin+01@gmail.com',
  role: UserRole.USER,
  status: UserStatus.ACTIVE,
};

export const mockingUserIncludePass = {
  ...mockingUserInfo,
  password: 'Abc@1234',
};

export const mockUuidUser = '11111111-1111-1111-1111-111111111111';

export const mockingUserRegister = {
  ...mockingUserIncludePass,
  firstName: 'Lin',
  lastName: 'Tran',
};

export const mockingUserLogin = {
  email: mockingUserInfo.email,
  password: mockingUserIncludePass.password,
};

export const mockingAdminLogin = {
  email: 'admin@example.com',
  password: mockingUserIncludePass.password,
};

export const mockingUserResponse = {
  ...mockingUserInfo,
  id: mockUuidUser,
  firstName: 'Lin',
  lastName: 'Tran',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const mockingMetadata = {
  total: 1,
  totalPages: 1,
  limit: 10,
  page: 1,
};

export const MOCKING_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';

export const mockingUser: User = Object.assign(new User(), {
  ...mockingUserResponse,
  createdAt: new Date(mockingUserResponse.createdAt),
  updatedAt: new Date(mockingUserResponse.updatedAt),
} as Partial<User>);
