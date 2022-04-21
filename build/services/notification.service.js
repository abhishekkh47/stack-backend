"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mail_1 = __importDefault(require("@sendgrid/mail"));
const config_1 = __importDefault(require("@app/config"));
const utility_1 = require("@app/utility");
const background_1 = require("@app/background");
const types_1 = require("@app/types");
mail_1.default.setApiKey(config_1.default.SENDGRID_API_KEY);
class NotificationService {
    async scheduleNotificationJobForDelivery(giftCard) {
        await (0, background_1.scheduleJob)(new Date(), types_1.EJOBS.PAYMENT_INITIATED_MAIL, {
            amount: giftCard.amount,
            email: giftCard.senderEmail,
        });
        if (giftCard.qrId) {
            await (0, background_1.scheduleJob)(giftCard.deliveryDate, types_1.EJOBS.SEND_MONEY_USING_QR, {
                qrId: giftCard.qrId,
            });
        }
        else {
            await (0, background_1.scheduleJob)(giftCard.deliveryDate, types_1.EJOBS.SEND_GIFT_CARD_REDEEM_MAIL, {
                amount: String(giftCard.amount),
                hash: giftCard.hash,
                receiver: giftCard.from,
                receiverId: giftCard.receiverEmail,
                sender: giftCard.senderEmail,
                giftCardId: giftCard._id,
            });
            await (0, background_1.scheduleJob)(giftCard.deliveryDate, types_1.EJOBS.SEND_GIFT_CARD_REDEEM_SMS, {
                amount: String(giftCard.amount),
                hash: giftCard.hash,
                receiver: giftCard.from,
                receiverId: giftCard.receiverEmail,
                sender: giftCard.senderEmail,
                giftCardId: giftCard._id,
            });
        }
    }
    async sendEmail(email, payload) {
        try {
            await mail_1.default.send(Object.assign(Object.assign({}, payload), { to: email, from: config_1.default.SENDGRID_FROM_EMAIL }));
        }
        catch (err) {
            console.log(err.response.body);
            utility_1.logger.error(JSON.stringify(Object.assign(Object.assign({ email }, payload), { message: err.message })));
        }
    }
    async sendSms(value, payload, email) {
        if (email) {
            try {
                await mail_1.default.send({
                    text: payload,
                    to: email,
                    from: config_1.default.SENDGRID_FROM_EMAIL,
                    subject: "OTP from stack",
                });
            }
            catch (err) {
                console.log(err.response.body);
                utility_1.logger.error(JSON.stringify(Object.assign(Object.assign({ email }, payload), { message: err.message })));
            }
        }
    }
}
exports.default = NotificationService;
//# sourceMappingURL=notification.service.js.map