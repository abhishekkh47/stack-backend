export interface IOtp {
  receiverMobile: string;
  code: number;
  type: EOTPTYPE;
  message: string;
  isVerified: EOTPVERIFICATION;
}

export enum EOTPTYPE {
  SIGN_UP = 1,
  CHANGE_MOBILE = 2,
  RESET_PASSWORD = 3,
}

export enum EOTPVERIFICATION {
  VERIFIED = 1,
  NOTVERIFIED = 0,
}

export const otpTimeLimit = 5.0;
