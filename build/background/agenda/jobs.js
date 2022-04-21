"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Jobs = void 0;
const types_1 = require("@app/types");
const services_1 = require("@app/services");
const utility_1 = require("@app/utility");
const config_1 = __importDefault(require("@app/config"));
exports.Jobs = [
    {
        name: types_1.EJOBS.PAYMENT_INITIATED_MAIL,
        processor: async (job) => {
            const { amount, email } = job.attrs.data;
            const notificationClient = new services_1.NotificationService();
            notificationClient.sendEmail(email, {
                subject: "Transaction From Stack",
                text: `Transaction From Stack`,
                html: `<div><p>We have initiated payment of $${amount} from your card. Usually it will take 3 business days to process and send crypto to your loved ones.</p><a href="${config_1.default.WEB_URL}" target="_blank">Visit again</a></div>`,
            });
        },
        options: { priority: 0 },
    },
    {
        name: types_1.EJOBS.SEND_GIFT_CARD_REDEEM_MAIL,
        processor: async (job) => {
            const { amount, hash, receiver, receiverId, sender, giftCardId } = job.attrs.data;
            const notificationClient = new services_1.NotificationService();
            await notificationClient.sendEmail(receiverId, {
                text: `You have received Crypto Gift card worth $${amount} from ${sender}.`,
                html: `Click this <a href="${(0, utility_1.getSharableLink)(hash)}">Link</a> to redeem your gift card.`,
                subject: `Crypto Gift from ${receiver} by Stack.`,
            });
        },
        options: { priority: 0 },
    },
    {
        name: types_1.EJOBS.SEND_GIFT_CARD_REDEEM_SMS,
        processor: async (job) => {
            const { amount, hash, receiverId, sender, giftCardId } = job.attrs.data;
            const notificationClient = new services_1.NotificationService();
            notificationClient.sendSms(receiverId, {
                content: `You have received Crypto Gift card worth $${amount} from ${sender}. Click this <a href="${(0, utility_1.getSharableLink)(hash)}" target="_blank">Link</a> to redeem your gift card.`,
            });
        },
        options: { priority: 0 },
    },
    {
        name: types_1.EJOBS.EXPIRE_GIFT_CARDS,
        processor: async () => {
        },
        options: { priority: 0 },
    },
];
//# sourceMappingURL=jobs.js.map