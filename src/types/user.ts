import mongoose from "mongoose";

export interface IUser extends IAccount {
  email: string;
  password: string;
  username: string;
  mobile: string;
  verificationEmailExpireAt: string;
  verificationCode: string;
  status: EUSERSTATUS;
  kycMessages: string[];
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
  taxState: mongoose.Schema.Types.ObjectId;
  profilePicture: string;
}

export interface IAdmin extends IUser {
  jwtToken: string;
}

export const ALLOWED_LOGIN_ATTEMPTS = 3;

export enum EUserType {
  TEEN = 1,
  PARENT = 2,
}

export enum ETRANSFER {
  ACH = 1,
  WIRE = 2,
}

export enum EUSERSTATUS {
  KYC_DOCUMENT_UPLOAD = 1,
  KYC_DOCUMENT_VERIFIED = 2,
  KYC_DOCUMENT_UPLOAD_FAILED = 3,
}
