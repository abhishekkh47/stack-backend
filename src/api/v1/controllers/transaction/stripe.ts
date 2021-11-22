import Koa from "koa";

import { HttpMethod } from "@app/types";
import { Route } from "@app/utility";
import BaseTransactionController from "./base";
import { StripeService } from "@app/services";
import config from "@app/config";

class StripeController extends BaseTransactionController {
  @Route({ path: "/stripe/charge", method: HttpMethod.POST })
  public async chargeWithStripe(ctx: Koa.Context) {
    const { id, hash } = <{ id: string; hash: string }>ctx.body;
    // const giftCard = await this.getGiftCardIfExists(hash);

    // const client = new StripeService();
    // const response = await client.chargeWithPaymentIntent({
    //   id,
    //   amount: giftCard.amount,
    //   description: "",
    // });
    // // await this.onPaymentSuccess(giftCard);
    return this.Ok(ctx, { message: "success" });
  }

  @Route({ path: "/stripe/config", method: HttpMethod.GET })
  public async getStripeConfig(ctx: Koa.Context) {
    return this.Ok(ctx, { stripePK: config.STRIPE_PUBLISHABLE_KEY });
  }
}

export default new StripeController();
