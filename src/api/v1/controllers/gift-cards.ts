import Koa from "koa";
import { nanoid, customAlphabet } from "nanoid";
import moment from "moment";

import { generateHash, Route, saveOtp, validateOtp } from "@app/utility";
import BaseController from "./base";
import {
  GiftCard,
  GiftCardModel,
  HttpMethod,
  ICreateQrCodePayload,
} from "@app/types";
import { GiftsTable, QrCodeTable } from "@app/model";
import { CircleService, NotificationService } from "@app/services";
import { Auth } from "@app/middleware";

const circle = new CircleService();

class GiftCardController extends BaseController {
  @Route({ path: "/gift-card", method: HttpMethod.GET })
  @Auth()
  public async getGiftCards(ctx: any) {
    const user = ctx.request.user;
    const gifts = await GiftsTable.find({ owner: user._id }).sort({
      createdAt: -1,
    });

    return this.Ok(ctx, {
      data: gifts,
      count: gifts.length,
    });
  }

  @Route({ path: "/gift-card/status", method: HttpMethod.GET })
  @Auth()
  public async getGiftCardStatus(ctx: any) {
    // TODO : Add validation for only allowed to see status of own gift cards only
    const paymentId = ctx.request.query.paymentId as string;
    const response = await circle.getPayment(paymentId);

    return this.Ok(ctx, {
      status: response?.data?.status,
    });
  }

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

    // const response = await GiftCardTable.create({
    //   senderEmail,
    //   sender,
    //   amount,
    //   deliveryDate,
    //   receiver,
    //   delivery,
    //   message,
    //   payment: {
    //     id: "",
    //     paymentType: "",
    //   },
    //   hash: generateHash(
    //     JSON.stringify({ ...ctx.request.body, uid: nanoid() })
    //   ),
    //   redeemed: "PENDING",
    // });

    // return this.Ok(ctx, response);
  }

  @Route({ path: "/gift-card-verify", method: HttpMethod.GET })
  public async verifyGiftCard(ctx: Koa.Context) {
    const { hash } = <Pick<GiftCardModel, "hash">>ctx.request.query;

    // const giftCard = await GiftCardTable.findOne({ hash });

    // if (!giftCard) {
    //   return this.BadRequest(ctx, "Gift Card not found");
    // }

    // if (giftCard.redeemed === "EXPIRED") {
    //   return this.BadRequest(
    //     ctx,
    //     `Gift Card has been expired ${moment(giftCard.deliveryDate).fromNow()}`
    //   );
    // }

    // if (giftCard.redeemed === "SUCCESS") {
    //   return this.BadRequest(ctx, "Gift Card is already redeemed");
    // }

    // if (giftCard.redeemed === "IN PROGRESS") {
    //   return this.BadRequest(ctx, "We are currently processing your Gift Card");
    // }

    // if (!giftCard.payment.id) {
    //   return this.BadRequest(ctx, "Payment is pending for this Gift Card");
    // }

    return this.Ok(ctx, {
      status: true,
      message: "Gift Card verified successfully",
    });
  }

  @Route({ path: "/gifts", method: HttpMethod.GET })
  public async getAllGiftCard(ctx: Koa.Context) {
    const data = await GiftsTable.find({});

    return this.Ok(ctx, data);
  }

  @Route({ path: "/gift", method: HttpMethod.GET })
  public async verifyGift(ctx: Koa.Context) {
    const { hash } = <{ hash: string }>ctx.request.query;
    const data = await GiftsTable.findOne({ hash });
    return this.Ok(ctx, data);
  }

  @Route({ path: "/gift/send-otp", method: HttpMethod.POST })
  public async sendOtp(ctx: Koa.Context) {
    const { number, email } = <{ number: string; email: string }>(
      ctx.request.body
    );
    const notificationClient = new NotificationService();
    const generateCode = customAlphabet("1234567890", 6);
    const otp = generateCode();
    await saveOtp(number, otp);
    await notificationClient.sendSms(
      number,
      `Your Stack Verification code is ${otp}`,
      email
    );

    return this.Ok(ctx, { success: true, message: "Otp sent" });
  }

  @Route({ path: "/gift/verify-otp", method: HttpMethod.POST })
  public async verifyGiftCardOtp(ctx: Koa.Context) {
    const { otp, number } = ctx.request.body;

    validateOtp(number, otp);

    return this.Ok(ctx, { success: true, message: "Otp verified" });
  }

  @Route({ path: "/qr-code", method: HttpMethod.POST })
  @Auth()
  public async createQrCode(ctx: any) {
    const user = ctx.request.user;
    const payload = <ICreateQrCodePayload>ctx.request.body;
    const hash = generateHash(
      JSON.stringify({ ...payload, createdAt: new Date().getTime() })
    );

    await QrCodeTable.create({
      ...payload,
      hash,
      owner: user?._id,
    });

    return this.Ok(ctx, { success: true, hash });
  }

  @Route({ path: "/qr-code", method: HttpMethod.GET })
  public async getQrCode(ctx: Koa.Context) {
    const { id } = <{ id: string }>ctx.request.query;
    const data = await QrCodeTable.findOne({ hash: id });
    return this.Ok(ctx, {
      success: !!data,
      data,
    });
  }

  @Route({ path: "/qr-codes", method: HttpMethod.GET })
  @Auth()
  public async getQrCodes(ctx: any) {
    const { _id } = ctx.request.user;
    const data = await QrCodeTable.find({ owner: _id });
    return this.Ok(ctx, {
      data,
      count: data.length,
    });
  }

  @Route({ path: "/gift-card-reactivate", method: HttpMethod.PUT })
  public async reactivateGiftCard(ctx: Koa.Context) {
    const { hash, deliveryDate } = <
      Pick<GiftCardModel, "hash" | "deliveryDate">
    >ctx.request.body;

    // const giftCard = await this.getGiftCardIfExists(hash);

    // if (
    //   giftCard.redeemed === "SUCCESS" ||
    //   giftCard.redeemed === "IN PROGRESS"
    // ) {
    //   return this.BadRequest(
    //     ctx,
    //     "You can't re-activate success or in-progress Gift Cards."
    //   );
    // }

    // if (giftCard.redeemed !== "EXPIRED") {
    //   return this.BadRequest(ctx, "Your Gift Card has not expired yet.");
    // }

    // await GiftCardTable.updateOne(
    //   { hash },
    //   { $set: { redeemed: "PENDING", deliveryDate } }
    // );

    // giftCard.deliveryDate = deliveryDate;

    // const notificationClient = new NotificationService();
    // await notificationClient.scheduleNotificationJobForDelivery(giftCard);

    return this.Ok(ctx, { message: "Gift Card re-activated." });
  }

  private async getGiftCardIfExists(hash: string) {
    // const giftCard = await GiftCardTable.findOne({ hash });
    // if (!giftCard) {
    //   throw new Error("Gift Card not found");
    // }
    // return giftCard;
  }
}

export default new GiftCardController();
