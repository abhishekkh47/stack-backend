import { GiftCardTable, GiftCardSchema } from "@app/model";
import { NotificationService } from "@app/services";
import { SupportedPaymentGatways, PaymentMode } from "@app/types";
import BaseController from "../base";

export default class BaseTransactionController extends BaseController {
  protected async getGiftCardIfExists(hash: string) {
    const giftCard = await GiftCardTable.findOne({ hash });
    if (!giftCard) {
      throw new Error("Gift Card not found");
    }

    return giftCard;
  }

  protected async savePaymentTransaction(
    giftCard: GiftCardSchema,
    response: any,
    gateway: SupportedPaymentGatways,
    mode: PaymentMode
  ) {
    // TODO : 
  }

  protected async onPaymentSuccess(
    giftCard: GiftCardSchema,
    response: any,
    gateway: SupportedPaymentGatways,
    mode: PaymentMode
  ) {
    await this.savePaymentTransaction(giftCard, response, gateway, mode);
    const notificationClient = new NotificationService();
    await notificationClient.scheduleNotificationJobForDelivery(giftCard);
  }
}
