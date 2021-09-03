import { SupportedPaymentGatways } from "./gift-card";

export interface PaymentTransaction {
  giftCardId: string;
  paymentMode: PaymentMode;
  data: any;
  method: SupportedPaymentGatways;
}

export type PaymentMode = "IN" | "OUT";
