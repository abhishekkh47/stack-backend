export interface GiftCard {
  sender: string;
  amount: number;
  delivery: GiftCardDelivery[];
  deliveryDate: Date;
  message: string;
  receiver: string;
  senderEmail: string;
}

export type GiftCardDeliveryMethod = "EMAIL" | "SMS";

export interface GiftCardModel extends GiftCard {
  hash: string;
  payment: GiftCardPayment;
  redeemed: GiftCardRedeemStatus;
}

export interface GiftCardPayment {
  id: string;
  paymentType: SupportedPaymentGatways;
}

export type SupportedPaymentGatways = "paypal" | "stripe";

export type GiftCardRedeemStatus =
  | "PENDING"
  | "IN PROGRESS"
  | "SUCCESS"
  | "EXPIRED";

export interface GiftCardDelivery {
  method: GiftCardDeliveryMethod;
  receiver: string;
  updatedAt?: Date;
  status?: "SUCCESS" | "FAILED";
}
