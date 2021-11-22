import Koa from "koa";

import { HttpMethod } from "@app/types";
import { Route } from "@app/utility";
import BaseTransactionController from "./base";
import { PaypalService } from "@app/services";
import config from "@app/config";

class PaypalController extends BaseTransactionController {
  @Route({ path: "/paypal/create-transaction", method: HttpMethod.POST })
  public async createPaypalTransaction(ctx: Koa.Context) {
    // const client = new PaypalService();
    // const { hash } = <{ hash: string }>ctx.request.body;
    // const giftCard = await this.getGiftCardIfExists(hash);
    // const response = await client.createOrderRequests({
    //   amount: String(giftCard.amount),
    // });

    // return this.Ok(ctx, response);
  }

  @Route({ path: "/paypal/capture-transaction", method: HttpMethod.POST })
  public async capturePaypalTransaction(ctx: Koa.Context) {
    // const client = new PaypalService();
    // const { orderId, hash } = <{ orderId: string; hash: string }>(
    //   ctx.request.body
    // );
    // const giftCard = await this.getGiftCardIfExists(hash);
    // const response = await client.captureTransaction(orderId);

    // // await this.onPaymentSuccess(giftCard);
    // return this.Ok(ctx, response);
  }

  @Route({ path: "/paypal/config", method: HttpMethod.GET })
  public async getPaypalConfig(ctx: Koa.Context) {
    return this.Ok(ctx, { clientId: config.PAYPAL_CLIENT_ID });
  }
}

export default new PaypalController();
