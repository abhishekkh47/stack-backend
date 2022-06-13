import mongoose from "mongoose";

export interface IUser extends IAccount {
  email: string;
  password: string;
  username: string;
  mobile: string;
  verificationEmailExpireAt: string;
  verificationCode: string;
  status: EUSERSTATUS;
  screenStatus: ESCREENSTATUS;
  kycMessages: string[];
  refreshToken: string;
  isParentFirst: boolean;
}

export interface IAccount {
  firstName: string;
  lastName: string;
  preLoadedCoins: number; // 0 by default
  isGifted: number;
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
  isAcknowledged: number;
  cipCleared: boolean;
  amlCleared: boolean;
  identityConfirmed: boolean;
  referralCode: string;
  isAutoApproval: EAUTOAPPROVAL;
}

export interface IAdmin extends IUser {
  jwtToken: string;
  zohoRefreshToken: string;
  zohoExpiryTime: string;
  zohoAccessToken: string;
  giftStackCoinsSetting: EGIFTSTACKCOINSSETTING;
  stackCoins: number;
}

export const ALLOWED_LOGIN_ATTEMPTS = 3;

export enum EAUTOAPPROVAL {
  ON = 1,
  OFF = 2,
}

export enum EUserType {
  TEEN = 1,
  PARENT = 2,
}

export enum EGIFTSTACKCOINSSETTING {
  ON = 1,
  OFF = 0,
}

export enum ETRANSFER {
  ACH = 1,
  WIRE = 2,
}

export enum EUSERSTATUS {
  KYC_DOCUMENT_UPLOAD = 1,
  KYC_DOCUMENT_VERIFIED = 3,
  KYC_DOCUMENT_UPLOAD_FAILED = 2,
}
export enum ESCREENSTATUS {
  SIGN_UP = 0,
  CHANGE_ADDRESS = 1,
  UPLOAD_DOCUMENTS = 3,
  ACKNOWLEDGE_SCREEN = 2,
  ADD_BANK_ACCOUNT = 4,
  SUCCESS = 5,
}
