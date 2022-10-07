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
  isGiftedCrypto: number; // 0 , 1 and 2
  type: EUserType;
  parentEmail: string;
  parentMobile: string;
  tempPassword: string;
  loginAttempts: number;
  country: string;
  stateId: mongoose.Schema.Types.ObjectId;
  state: string;
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
  accountStatus: string;
  referralCode: string;
  isAutoApproval: EAUTOAPPROVAL;
  isRecurring: ERECURRING;
  selectedDeposit: number;
  selectedDepositDate;
}

export interface IAdmin extends IUser {
  jwtToken: string;
  zohoRefreshToken: string;
  zohoExpiryTime: string;
  zohoAccessToken: string;
  giftStackCoinsSetting: EGIFTSTACKCOINSSETTING;
  stackCoins: number;
  giftCryptoSetting: EGIFTSTACKCOINSSETTING;
  giftCryptoAmount: number;
}

export const ALLOWED_LOGIN_ATTEMPTS = 3;

export enum EAUTOAPPROVAL {
  ON = 1,
  OFF = 0,
}

export enum ERECURRING {
  NO_BANK = 0,
  NO_RECURRING = 1,
  DAILY = 2,
  WEEKLY = 3,
  MONTLY = 4,
}

export enum EUserType {
  TEEN = 1,
  PARENT = 2,
  SELF = 3, //creating account for him/her
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
  /**
   * for parents old
   */
  // SIGN_UP = 0,
  // CHANGE_ADDRESS = 1,
  // UPLOAD_DOCUMENTS = 3,
  // ACKNOWLEDGE_SCREEN = 2,
  // ADD_BANK_ACCOUNT = 4,
  // SUCCESS = 5,
  /**
   * for parent new
   */
  SIGN_UP = 0,
  UPLOAD_DOCUMENTS = 1,
  ADD_BANK_ACCOUNT = 2,
  SUCCESS = 3,
  /**
   * for teen
   */
  SIGN_UP_TEEN = 0,
  CREATE_USERNAME = 1,
  ENTER_PHONE_NO = 2,
  ENTER_NAME = 3,
  ENTER_PARENT_INFO = 4,
  SUCCESS_TEEN = 5,
}


