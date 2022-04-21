"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = __importDefault(require("@app/config"));
class TwilioService {
    sendSMS(phoneNo, message) {
        return new Promise((resolve, reject) => {
            const client = require("twilio")(config_1.default.TWILIO_ACCOUNT_SID, config_1.default.TWILIO_AUTH_TOKEN);
            client.messages
                .create({
                body: message,
                from: config_1.default.TWILIO_PHONE_NUMBER,
                to: phoneNo,
            })
                .then((messageData) => {
                return resolve({
                    code: 200,
                    message: messageData.sid,
                });
            })
                .catch((error) => {
                return reject({
                    code: 400,
                    message: "Twilio Error Invalid Number",
                });
            });
        });
    }
}
exports.default = new TwilioService();
//# sourceMappingURL=twilio.service.js.map