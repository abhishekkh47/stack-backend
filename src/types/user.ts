export interface IUser extends IAccount {
  email: string;
  password: string;
  username: string;
  mobile: string;
  verificationEmailExpireAt: string;
  verificationCode: string;
}

export interface IAccount {
  address: string;
  firstName: string;
  lastName: string;
  type: EUserType;
  parentEmail: string;
  parentMobile: string;
  tempPassword: string;
  loginAttempts: number;
}

export const ALLOWED_LOGIN_ATTEMPTS = 3;

export enum EUserType {
  TEEN = 1,
  PARENT = 2,
}
