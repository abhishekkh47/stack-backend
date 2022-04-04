export interface IUser extends IAccount {
  email: string;
  password: string;
  username: string;
  verificationEmailExpireAt: string;
  verificationCode: string;
}

export interface IAccount {
  address: string;
}
