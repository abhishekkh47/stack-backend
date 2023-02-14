import mongoose from "mongoose";

export interface IUser extends IAccount {
  email: string;
  mobile: string;
  status: EUSERSTATUS;
  funded: boolean;
  screenStatus: ESCREENSTATUS;
  kycMessages: string[];
  isParentFirst: boolean;
  isEnteredParentNumber: boolean;
  quizCoins: number;
  isNotificationOn: number;
  unlockRewardTime: string;
  isPhoneVerified: number;
  isRewardDeclined: boolean;
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
  country: string;
  stateId: mongoose.Schema.Types.ObjectId;
  state: string;
  city: string;
  address: string;
  postalCode: string;
  unitApt: string;
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
  username: string;
  rewardHours: number;
  zohoRefreshToken: string;
  zohoExpiryTime: string;
  zohoAccessToken: string;
  giftStackCoinsSetting: EGIFTSTACKCOINSSETTING;
  stackCoins: number;
  giftCryptoSetting: EGIFTSTACKCOINSSETTING;
  giftCryptoAmount: number;
}

export interface IUserdraft {
  email: string;
  dob: string;
  screenStatus: number;
  firstName: string;
  lastName: string;
  type: number;
  mobile: string;
  isPhoneVerified: number;
}

export const ALLOWED_LOGIN_ATTEMPTS = 3;

export enum EAUTOAPPROVAL {
  ON = 1,
  OFF = 0,
}

export enum ENOTIFICATIONSETTINGS {
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
  KYC_DOCUMENT_UPLOAD_FAILED = 2,
  KYC_DOCUMENT_VERIFIED = 3,
  ACCOUNT_CLOSED = 4,
}
export enum ESCREENSTATUS {
  /**
   * for parent new, self and teen
   */
  SIGN_UP = 0,
  DOB_SCREEN = 1,

  /**
   * for parent and self
   */
  MYSELF_PARENT_SCREEN = 2,
  DETAIL_SCREEN = 3,
  CHILD_INFO_SCREEN = 4,
  UPLOAD_DOCUMENTS = 5,
  ADD_BANK_ACCOUNT = 6,
  SUCCESS = 7,

  /**
   * for teen
   */

  ENTER_PHONE_NO = 8,
  ENTER_PARENT_INFO = 9,
  SUCCESS_TEEN = 10,
}

export enum EPHONEVERIFIEDSTATUS {
  TRUE = 1,
  FALSE = 0,
}
