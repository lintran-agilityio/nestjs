export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
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
