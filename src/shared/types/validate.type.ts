import { UserRole } from './user.type';

export type ValidOwnerShipParamsType = {
  currentUser?: { id: string; email: string; role: UserRole };
  value: string;
  field: 'id' | 'email';
  logger: {
    error: (message: string) => void;
  };
};
