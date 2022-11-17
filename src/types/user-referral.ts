export interface IUserReferral {
  userId: string;
  referralCount: string;
  referralArray: referralArray[];
  senderName: string;
}

export interface referralArray {
  referredId: string;
  coinsGifted: number;
  type: EReferralType;
  receiverName: string;
}
export enum EReferralType {
  SMS = 1,
  QR_CODE = 2,
}
