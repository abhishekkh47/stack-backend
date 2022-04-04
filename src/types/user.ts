export interface IUser extends IAccount {
  email: string;
  password: string;
  username: string;
  mobile: string;
}

export interface IAccount {
  address: string;
  firstName: string;
  lastName: string;
  type: EUserType;
  parentEmail: string;
  parentMobile: string;
}

export enum EUserType {
  TEEN = 1,
  PARENT = 2,
}
