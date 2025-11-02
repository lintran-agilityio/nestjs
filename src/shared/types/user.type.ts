export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export interface IJwtAuthPayload {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}

export interface IUserInfo extends IJwtAuthPayload {
  firstName: string;
  lastName: string;
}
