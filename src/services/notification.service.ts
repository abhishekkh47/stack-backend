import sgmail from "@sendgrid/mail";

import config from "@app/config";
import { logger } from "@app/utility";
import { IGiftSchema } from "@app/model";
import { scheduleJob } from "@app/background";
import {
  EJOBS,
  IPaymentInitiatedJobArg,
  ISendMoneyUsingQrJobArg,
  NotificationJobArgs,
} from "@app/types";

sgmail.setApiKey(config.SENDGRID_API_KEY);

export interface MailSendArgs {
  text: string;
  subject: string;
  html?: string;
}

export default class NotificationService {
  public async scheduleNotificationJobForDelivery(giftCard: IGiftSchema) {
    await scheduleJob<IPaymentInitiatedJobArg>(
      new Date(),
      EJOBS.PAYMENT_INITIATED_MAIL,
      {
        amount: giftCard.amount,
        email: giftCard.senderEmail,
      }
    );
    if (giftCard.qrId) {
      await scheduleJob<ISendMoneyUsingQrJobArg>(
        giftCard.deliveryDate,
        EJOBS.SEND_MONEY_USING_QR,
        {
          qrId: giftCard.qrId,
        }
      );
    } else {
      await scheduleJob<NotificationJobArgs>(
        giftCard.deliveryDate,
        EJOBS.SEND_GIFT_CARD_REDEEM_MAIL,
        {
          amount: String(giftCard.amount),
          hash: giftCard.hash,
          receiver: giftCard.from,
          receiverId: giftCard.receiverEmail,
          sender: giftCard.senderEmail,
          giftCardId: giftCard._id,
        }
      );
      await scheduleJob<NotificationJobArgs>(
        giftCard.deliveryDate,
        EJOBS.SEND_GIFT_CARD_REDEEM_SMS,
        {
          amount: String(giftCard.amount),
          hash: giftCard.hash,
          receiver: giftCard.from,
          receiverId: giftCard.receiverEmail,
          sender: giftCard.senderEmail,
          giftCardId: giftCard._id,
        }
      );
    }
  }
  public async sendEmail(email: string, payload: MailSendArgs) {
    try {
      await sgmail.send({
        ...payload,
        to: email,
        from: config.SENDGRID_FROM_EMAIL,
      });
    } catch (err) {
      console.log(err.response.body);
      logger.error(JSON.stringify({ email, ...payload, message: err.message }));
    }
  }

  public async sendSms(value: string, payload: any, email?: string) {
    if (email) {
      try {
        await sgmail.send({
          text: payload,
          to: email,
          from: config.SENDGRID_FROM_EMAIL,
          subject: "OTP from stack",
        });
      } catch (err) {
        console.log(err.response.body);
        logger.error(
          JSON.stringify({ email, ...payload, message: err.message })
        );
      }
    }

    //   TODO : Implement in future
  }
}
