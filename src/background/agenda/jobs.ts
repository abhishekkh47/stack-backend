import { Job } from "agenda";

import { AgendaJobs, EJOBS, NotificationJobArgs } from "@app/types";
import { NotificationService } from "@app/services";
import { getSharableLink } from "@app/utility";
import { GiftCardTable } from "@app/model";

export const Jobs: AgendaJobs[] = [
  {
    name: EJOBS.SEND_GIFT_CARD_REDEEM_MAIL,
    processor: async (job: Job<NotificationJobArgs>) => {
      const { amount, hash, receiver, receiverId, sender, giftCardId } =
        job.attrs.data;

      const notificationClient = new NotificationService();

      await notificationClient.sendEmail(receiverId, {
        text: `You have received Crypto Gift card worth $${amount} from ${sender}.`,
        html: `Click this <a href="${getSharableLink(
          hash
        )}">Link</a> to redeem your gift card.`,
        subject: `Crypto Gift from ${receiver} by Stack.`,
      });

      await GiftCardTable.updateOne(
        {
          _id: giftCardId,
          "delivery.receiver": receiverId,
          "delivery.method": "EMAIL",
        },
        {
          $set: {
            "delivery.$.updatedAt": new Date(),
            "delivery.$.status": "SUCCESS",
          },
        }
      );
    },
    options: { priority: 0 },
  },
  {
    name: EJOBS.SEND_GIFT_CARD_REDEEM_SMS,
    processor: async (job: Job<NotificationJobArgs>) => {
      const { amount, hash, receiverId, sender, giftCardId } = job.attrs.data;
      const notificationClient = new NotificationService();
      notificationClient.sendSms(receiverId, {
        content: `You have received Crypto Gift card worth $${amount} from ${sender}. Click this <a href="${getSharableLink(
          hash
        )}" target="_blank">Link</a> to redeem your gift card.`,
      });

      await GiftCardTable.updateOne(
        {
          _id: giftCardId,
          "delivery.receiver": receiverId,
          "delivery.method": "SMS",
        },
        {
          $set: {
            "delivery.$.updatedAt": new Date(),
            "delivery.$.status": "SUCCESS",
          },
        }
      );
    },
    options: { priority: 0 },
  }
];
