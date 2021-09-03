import Koa from "koa";
import { nanoid } from "nanoid";
import moment from "moment";

import { generateHash, Route } from "@app/utility";
import BaseController from "./base";
import { GiftCard, GiftCardModel, HttpMethod } from "@app/types";
import { GiftCardTable } from "@app/model";
import { NotificationService } from "@app/services";

class GiftCardController extends BaseController {
  @Route({ path: "/gift-card", method: HttpMethod.POST })
  public async addGiftCard(ctx: Koa.Context) {
    const {
      amount,
      deliveryDate,
      delivery,
      message,
      sender,
      receiver,
      senderEmail,
    } = <GiftCard>ctx.request.body;

    const response = await GiftCardTable.create({
      senderEmail,
      sender,
      amount,
      deliveryDate,
      receiver,
      delivery,
      message,
      payment: {
        id: "",
        paymentType: "",
      },
      hash: generateHash(
        JSON.stringify({ ...ctx.request.body, uid: nanoid() })
      ),
      redeemed: "PENDING",
    });

    return this.Ok(ctx, response);
  }

  @Route({ path: "/gift-card-verify", method: HttpMethod.GET })
  public async verifyGiftCard(ctx: Koa.Context) {
    const { hash } = <Pick<GiftCardModel, "hash">>ctx.request.query;

    const giftCard = await GiftCardTable.findOne({ hash });

    if (!giftCard) {
      return this.BadRequest(ctx, "Gift Card not found");
    }

    if (giftCard.redeemed === "EXPIRED") {
      return this.BadRequest(
        ctx,
        `Gift Card has been expired ${moment(giftCard.deliveryDate).fromNow()}`
      );
    }

    if (giftCard.redeemed === "SUCCESS") {
      return this.BadRequest(ctx, "Gift Card is already redeemed");
    }

    if (giftCard.redeemed === "IN PROGRESS") {
      return this.BadRequest(ctx, "We are currently processing your Gift Card");
    }

    if (!giftCard.payment.id) {
      return this.BadRequest(ctx, "Payment is pending for this Gift Card");
    }

    return this.Ok(ctx, {
      status: true,
      message: "Gift Card verified successfully",
    });
  }

  @Route({ path: "/gift-card-reactivate", method: HttpMethod.PUT })
  public async reactivateGiftCard(ctx: Koa.Context) {
    const { hash, deliveryDate } = <
      Pick<GiftCardModel, "hash" | "deliveryDate">
    >ctx.request.body;

    const giftCard = await this.getGiftCardIfExists(hash);

    if (
      giftCard.redeemed === "SUCCESS" ||
      giftCard.redeemed === "IN PROGRESS"
    ) {
      return this.BadRequest(
        ctx,
        "You can't re-activate success or in-progress Gift Cards."
      );
    }

    if (giftCard.redeemed !== "EXPIRED") {
      return this.BadRequest(ctx, "Your Gift Card has not expired yet.");
    }

    await GiftCardTable.updateOne(
      { hash },
      { $set: { redeemed: "PENDING", deliveryDate } }
    );

    giftCard.deliveryDate = deliveryDate;

    const notificationClient = new NotificationService();
    await notificationClient.scheduleNotificationJobForDelivery(giftCard);

    return this.Ok(ctx, { message: "Gift Card re-activated." });
  }

  private async getGiftCardIfExists(hash: string) {
    const giftCard = await GiftCardTable.findOne({ hash });
    if (!giftCard) {
      throw new Error("Gift Card not found");
    }

    return giftCard;
  }
}

export default new GiftCardController();
