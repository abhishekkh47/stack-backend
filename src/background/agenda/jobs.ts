import { Job } from "agenda";

import {
  AgendaJobs,
  EJOBS,
  IPaymentInitiatedJobArg,
  ISendMoneyUsingQrJobArg,
  NotificationJobArgs,
} from "@app/types";
import { NotificationService } from "@app/services";
import { getReactivateLink, getSharableLink } from "@app/utility";
import { GiftsTable, QrCodeTable } from "@app/model";
import config from "@app/config";

export const Jobs: AgendaJobs[] = [
  // {
  //   name: EJOBS.SEND_MONEY_USING_QR,
  //   processor: async (job: Job<ISendMoneyUsingQrJobArg>) => {
  //     const { qrId } = job.attrs.data;
  //     const gift = await GiftsTable.findOne({ qrId });
  //     if (!gift) {
  //       throw new Error("No gift card exists");
  //     }
  //     if (gift.transferId) {
  //       throw new Error("Payment already initiated.");
  //     }
  //     const circle = new ();
  //     const qrData = await QrCodeTable.findOne({ hash: qrId });
  //     if (!qrData) {
  //       throw new Error("Qr Code data not found");
  //     }
  //     const transferId = await circle.sendMoney({
  //       destination: {
  //         type: "blockchain",
  //         address: qrData.address,
  //         chain: qrData.chain,
  //       },
  //       amount: {
  //         amount: gift.amount,
  //         currency: "USD",
  //       },
  //     });
  //     await gift.updateOne({ transferId });
  //   },
  //   options: { priority: 0 },
  // },
  {
    name: EJOBS.PAYMENT_INITIATED_MAIL,
    processor: async (job: Job<IPaymentInitiatedJobArg>) => {
      const { amount, email } = job.attrs.data;

      const notificationClient = new NotificationService();
      notificationClient.sendEmail(email, {
        subject: "Transaction From Stack",
        text: `Transaction From Stack`,
        html: `<div><p>We have initiated payment of $${amount} from your card. Usually it will take 3 business days to process and send crypto to your loved ones.</p><a href="${config.WEB_URL}" target="_blank">Visit again</a></div>`,
      });
    },
    options: { priority: 0 },
  },
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

      // await GiftCardTable.updateOne(
      //   {
      //     _id: giftCardId,
      //     "delivery.receiver": receiverId,
      //     "delivery.method": "EMAIL",
      //   },
      //   {
      //     $set: {
      //       "delivery.$.updatedAt": new Date(),
      //       "delivery.$.status": "SUCCESS",
      //     },
      //   }
      // );
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

      // await GiftCardTable.updateOne(
      //   {
      //     _id: giftCardId,
      //     "delivery.receiver": receiverId,
      //     "delivery.method": "SMS",
      //   },
      //   {
      //     $set: {
      //       "delivery.$.updatedAt": new Date(),
      //       "delivery.$.status": "SUCCESS",
      //     },
      //   }
      // );
    },
    options: { priority: 0 },
  },
  {
    name: EJOBS.EXPIRE_GIFT_CARDS,
    processor: async () => {
      // const expiredGiftCards = await GiftCardTable.aggregate([
      //   {
      //     $match: { redeemed: "PENDING" },
      //   },
      //   {
      //     $project: {
      //       _id: 1,
      //       difference: {
      //         $divide: [
      //           { $subtract: [new Date(), "$deliveryDate"] },
      //           60 * 1000 * 60 * 24,
      //         ],
      //       },
      //       senderEmail: 1,
      //       receiver: 1,
      //       amount: 1,
      //       hash: 1,
      //     },
      //   },
      //   {
      //     $match: {
      //       difference: { $gt: config.GIFT_CARD_EXPIRED_IN_DAYS }, // If it's greater than 5 days then we are making them as expired
      //     },
      //   },
      // ]);
      // await GiftCardTable.updateMany(
      //   {
      //     _id: { $in: expiredGiftCards.map((x) => x._id) },
      //   },
      //   { $set: { redeemed: "EXPIRED" } }
      // );
      // expiredGiftCards.forEach((card) => {
      //   const notificationClient = new NotificationService();
      //   notificationClient.sendEmail(card.senderEmail, {
      //     subject: "Gift Card Expired",
      //     text: `Your Gift Card worth $${card.amount} has been expired due to not redeemed within ${config.GIFT_CARD_EXPIRED_IN_DAYS} days of delivery date by ${card.receiver}. Still you can re-activate Gift Card by clicking below link.`,
      //     html: `<a href="${getReactivateLink(
      //       card.hash
      //     )}" target="_blank">Re-Activate</a>`,
      //   });
      // });
    },
    options: { priority: 0 },
  },
];
