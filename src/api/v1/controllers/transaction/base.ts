import config from "@app/config";
import { PaymentTransactionTable, IGiftSchema } from "@app/model";
import { NotificationService } from "@app/services";
import { SupportedPaymentGatways, PaymentMode } from "@app/types";
import BaseController from "../base";

export default class BaseTransactionController extends BaseController {
  // protected async getGiftCardIfExists(hash: string) {
  //   const giftCard = await GiftCardTable.findOne({ hash });
  //   if (!giftCard) {
  //     throw new Error("Gift Card not found");
  //   }

  //   return giftCard;
  // }

  // protected async savePaymentTransaction(
  //   giftCard: GiftCardSchema,
  //   response: any,
  //   gateway: SupportedPaymentGatways,
  //   mode: PaymentMode
  // ) {
  //   const paymentTransaction = await PaymentTransactionTable.findOneAndUpdate(
  //     { giftCardId: giftCard._id },
  //     {
  //       $set: {
  //         data: response,
  //         giftCardId: giftCard.id,
  //         method: gateway,
  //         paymentMode: mode,
  //       },
  //     },
  //     {
  //       upsert: true,
  //       new: true,
  //     }
  //   );

  //   await GiftCardTable.updateOne(
  //     { _id: giftCard._id },
  //     {
  //       $set: { payment: { id: paymentTransaction._id, paymentType: gateway } },
  //     }
  //   );
  // }

  protected async onPaymentSuccess(giftCard: IGiftSchema) {
    const notificationClient = new NotificationService();
    await notificationClient.scheduleNotificationJobForDelivery(giftCard);
  }

  protected async sendPaymentInitiatedMail({ email, amount }) {
    const notificationClient = new NotificationService();

    notificationClient.sendEmail(email, {
      subject: "Transaction From Stack",
      text: `Transaction From Stack`,
      html: `<div><p>We have initiated payment of $${amount} from your card. Usually it will take 3 business days to process and send crypto to your loved ones.</p><a href="${config.WEB_URL}" target="_blank">Visit again</a></div>`,
    });
  }

  protected async sendGiftCardReedeemMail({ email, amount, link }) {
    const notificationClient = new NotificationService();
    await notificationClient.sendEmail(email, {
      text: `You have received Crypto Gift card worth $${amount}.`,
      html: `Click this <a href="${link}">Link</a> to redeem your gift card.`,
      subject: `Crypto Gift by Stack.`,
    });
  }
}
