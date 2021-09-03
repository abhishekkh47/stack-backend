import sgmail from "@sendgrid/mail";

import config from "@app/config";
import { logger } from "@app/utility";
import { GiftCardSchema } from "@app/model";
import { scheduleJob } from "@app/background";
import { EJOBS, NotificationJobArgs } from "@app/types";

sgmail.setApiKey(config.SENDGRID_API_KEY);

export interface MailSendArgs {
  text: string;
  subject: string;
  html?: string;
}

export default class NotificationService {
  public async scheduleNotificationJobForDelivery(giftCard: GiftCardSchema) {
    for (const el of giftCard.delivery) {
      switch (el.method) {
        case "EMAIL":
          await scheduleJob<NotificationJobArgs>(
            giftCard.deliveryDate,
            EJOBS.SEND_GIFT_CARD_REDEEM_MAIL,
            {
              amount: String(giftCard.amount),
              hash: giftCard.hash,
              receiver: giftCard.receiver,
              receiverId: el.receiver,
              sender: giftCard.sender,
              giftCardId: giftCard._id,
            }
          );
          break;

        case "SMS":
          await scheduleJob<NotificationJobArgs>(
            giftCard.deliveryDate,
            EJOBS.SEND_GIFT_CARD_REDEEM_SMS,
            {
              amount: String(giftCard.amount),
              hash: giftCard.hash,
              receiver: giftCard.receiver,
              receiverId: el.receiver,
              sender: giftCard.sender,
              giftCardId: giftCard._id,
            }
          );
          break;
        default:
          throw new Error("Delivery Method not implemented yet.");
      }
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
      logger.error(JSON.stringify({ email, ...payload, message: err.message }));
    }
  }

  public async sendSms(number: string, payload: any) {
    //   TODO : Implement in future
  }
}
