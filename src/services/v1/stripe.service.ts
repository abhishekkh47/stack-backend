import Stripe from "stripe";

import config from "@app/config";
import { logger } from "@app/utility";

export interface ChargeWithPaymentIntentArgs {
  id: string;
  amount: number;
  description?: string;
}

export default class StripeService {
  private client: Stripe;
  constructor() {
    this.client = new Stripe(config.STRIPE_SECRET_KEY, {
      apiVersion: "2020-08-27",
    });
  }

  public async chargeWithPaymentIntent({
    id,
    amount,
    description = "",
  }: ChargeWithPaymentIntentArgs) {
    const response = await this.client.paymentIntents.create({
      amount,
      currency: "USD",
      description,
      payment_method: id,
      confirm: true,
    });

    logger.log("info", response);
    return response;
  }
}
