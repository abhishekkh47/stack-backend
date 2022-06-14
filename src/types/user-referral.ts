export interface IUserReferral {
  userId: string;
  referralCount: string;
  referralArray: referralArray[];
}

export interface referralArray {
  referredId: string;
  coinsGifted: number;
  type: EReferralType;
}
export enum EReferralType {
  SMS = 1,
  QR_CODE = 2,
}
