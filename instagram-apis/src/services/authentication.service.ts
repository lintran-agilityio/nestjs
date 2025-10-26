// libs
import { compare, genSalt, hash } from 'bcrypt';

import { User } from '@/models';
import { omitField } from '@/utils';
import { IUserInfo, IUserLogin, IUserResponse } from '@/types';

class AuthenticationService {
  /**
   * Check if a user with the given email already exists
   * @param email - The email to check
   * @returns Promise<boolean> - True if user exists, false otherwise
   */
  isExistedUser = async (email: string) => {
    const user = await User.findOne({ where: { email } });
    return !!user;
  };

  /**
   * Create a new user with hashed password
   * @param payload - User information including password
   * @returns Promise<IUserResponse> - Created user without password field
   */
  create = async (payload: IUserInfo) => {
    try {
      const salt = await genSalt(10);
      const hashedPassword = await hash(payload.password, salt);
      const user = await User.create({ ...payload, password: hashedPassword });

      return omitField(user.toJSON(), 'password');
    } catch (error) {
      throw error;
    }
  };

  /**
   * Authenticate user login with email and password
   * @param payload - Login credentials (email and password)
   * @returns Promise<IUserResponse | null> - User data if authentication successful, null otherwise
   */
  login = async (payload: IUserLogin): Promise<IUserResponse | null> => {
    const { email, password } = payload;

    try {
      const user = await User.findOne({ where: { email } });
      if (!user) return null;

      const isValidPassword = await compare(password, user.password);
      return isValidPassword ? omitField(user.toJSON(), 'password') : null;
    } catch (error) {
      throw error;
    }
  };
}

export const authenticationService = new AuthenticationService();
