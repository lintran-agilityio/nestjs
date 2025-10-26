export interface IUserLogin {
  email: string;
  password: string;
};

export interface IUserInfo extends IUserLogin {
  username: string;
  isAdmin: boolean;
};

export interface IUser extends IUserInfo {
  userId: number;
}

export type IUserResponse = Omit<IUser, 'password'>;