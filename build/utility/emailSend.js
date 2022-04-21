"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const mail_1 = __importDefault(require("@sendgrid/mail"));
mail_1.default.setApiKey(process.env.SENDGRID_API_KEY);
const sendEmail = (email, template, data) => {
    const msg = {
        to: email,
        from: process.env.SENDGRID_FROM_EMAIL,
        subject: data.subject,
        templateId: template,
        dynamic_template_data: data,
    };
    mail_1.default.send(msg).then((s) => { }, (error) => {
        throw new Error(error.message);
    });
};
exports.sendEmail = sendEmail;
//# sourceMappingURL=emailSend.js.map