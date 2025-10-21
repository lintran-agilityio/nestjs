// libs
import { FindOptionsSelect } from 'typeorm';
import { User } from '../entities';

export const USE_SELECT_FIELDS: FindOptionsSelect<User> = {
  id: true,
  role: true,
  firstName: true,
  lastName: true,
  status: true,
  email: true,
  password: false,
  createdAt: true,
};
