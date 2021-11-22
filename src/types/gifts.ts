import { MongooseModel } from "./db";

export interface IGift {
  amount: number;
  currency: string;
  giftType: EGiftType;
  from: string;
  deliveryDate: Date;
  message: string;
  templateUrl: string;
  senderEmail: string;
  senderMobile: string;
  receiverEmail: string;
  receiverNumber: string;
  paymentId: string;
  cardId: string;
  hash: string;
  transferId: string;
  qrId?: string;
  owner: string;
  receiverId: string;
}

export enum EGiftType {
  CRYPTO = "Crypto",
  STOCK = "Stock",
  NFT = "NFT",
}

export type IGiftModel = MongooseModel<IGift>;

export interface ICreateGiftBody extends IGift {
  billingDetails: {
    city: string;
    country: string;
    line1: string;
    name: string;
    postalCode: string;
    discount: string;
    line2?: string;
    district: string;
  };
  number: string;
  cvv: string;
  expMonth: number;
  expYear: number;
  metadata: IMetadata;
}

export interface IMetadata {
  email: string;
  ipAddress: string;
  sessionId: string;
  phoneNumber: string;
}
