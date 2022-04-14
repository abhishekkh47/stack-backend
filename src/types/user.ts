import mongoose from "mongoose";

export interface IUser extends IAccount {
  email: string;
  password: string;
  username: string;
  mobile: string;
  verificationEmailExpireAt: string;
  verificationCode: string;
  refreshToken: string;
}

export interface IAccount {
  firstName: string;
  lastName: string;
  type: EUserType;
  parentEmail: string;
  parentMobile: string;
  tempPassword: string;
  loginAttempts: number;
  country: string;
  stateId: mongoose.Schema.Types.ObjectId;
  city: string;
  address: string;
  postalCode: string;
  unitApt: string;
  liquidAsset: number;
  taxIdNo: string;
  dob: string;
  taxState: string;
}

export interface IAdmin extends IUser {
  jwtToken: string;
}

export const ALLOWED_LOGIN_ATTEMPTS = 3;

export enum EUserType {
  TEEN = 1,
  PARENT = 2,
}
