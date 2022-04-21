"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = __importDefault(require("@app/config"));
const services_1 = require("@app/services");
const base_1 = __importDefault(require("../base"));
class BaseTransactionController extends base_1.default {
    async onPaymentSuccess(giftCard) {
        const notificationClient = new services_1.NotificationService();
        await notificationClient.scheduleNotificationJobForDelivery(giftCard);
    }
    async sendPaymentInitiatedMail({ email, amount }) {
        const notificationClient = new services_1.NotificationService();
        notificationClient.sendEmail(email, {
            subject: "Transaction From Stack",
            text: `Transaction From Stack`,
            html: `<div><p>We have initiated payment of $${amount} from your card. Usually it will take 3 business days to process and send crypto to your loved ones.</p><a href="${config_1.default.WEB_URL}" target="_blank">Visit again</a></div>`,
        });
    }
    async sendGiftCardReedeemMail({ email, amount, link }) {
        const notificationClient = new services_1.NotificationService();
        await notificationClient.sendEmail(email, {
            text: `You have received Crypto Gift card worth $${amount}.`,
            html: `Click this <a href="${link}">Link</a> to redeem your gift card.`,
            subject: `Crypto Gift by Stack.`,
        });
    }
}
exports.default = BaseTransactionController;
//# sourceMappingURL=base.js.map