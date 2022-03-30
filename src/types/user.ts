export interface IUser extends IAccount {
  email: string;
  password: string;
  username: string;
}

export interface IAccount {
  address: string;
}
