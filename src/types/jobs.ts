import { Processor, DefineOptions } from "agenda";

export interface AgendaJobs {
  name: string;
  processor: Processor;
  options?: DefineOptions;
}

export interface NotificationJobArgs {
  amount: string;
  sender: string;
  hash: string;
  receiver: string;
  receiverId: string;
  giftCardId: string;
}

export interface IPaymentInitiatedJobArg {
  email: string;
  amount: number;
}

export interface ISendMoneyUsingQrJobArg {
  qrId: string;
}

export enum EJOBS {
  SEND_GIFT_CARD_REDEEM_MAIL = "SEND_GIFT_CARD_REDEEM_MAIL",
  SEND_GIFT_CARD_REDEEM_SMS = "SEND_GIFT_CARD_REDEEM_SMS",
  EXPIRE_GIFT_CARDS = "EXPIRE_GIFT_CARDS",
  PAYMENT_INITIATED_MAIL = "PAYMENT_INITIATED_MAIL",
  SEND_MONEY_USING_QR = "SEND_MONEY_USING_QR",
}
