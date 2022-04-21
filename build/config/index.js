"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    get PORT() {
        return process.env.PORT;
    },
    get PAYPAL_CLIENT_ID() {
        return process.env.PAYPAL_CLIENT_ID;
    },
    get PAYPAL_CLIENT_SECRET() {
        return process.env.PAYPAL_CLIENT_SECRET;
    },
    get STRIPE_PUBLISHABLE_KEY() {
        return process.env.STRIPE_PUBLISHABLE_KEY;
    },
    get STRIPE_SECRET_KEY() {
        return process.env.STRIPE_SECRET_KEY;
    },
    get DB_PATH() {
        return process.env.DB_PATH;
    },
    get SENDGRID_API_KEY() {
        return process.env.SENDGRID_API_KEY;
    },
    get SENDGRID_FROM_EMAIL() {
        return process.env.SENDGRID_FROM_EMAIL;
    },
    get GIFT_CARD_EXPIRED_IN_DAYS() {
        return 5;
    },
    get CIRCLE_BASE_URL() {
        return process.env.CIRCLE_BASE_URL || "https://api-sandbox.circle.com";
    },
    get CIRCLE_API_KEY() {
        return process.env.CIRCLE_API_KEY;
    },
    get CIRCLE_WEBHOOK_URL() {
        return process.env.CIRCLE_WEBHOOK_URL;
    },
    get WEB_URL() {
        return process.env.WEB_URL;
    },
    get TWILIO_ACCOUNT_SID() {
        return process.env.TWILIO_ACCOUNT_SID;
    },
    get TWILIO_AUTH_TOKEN() {
        return process.env.TWILIO_AUTH_TOKEN;
    },
    get TWILIO_PHONE_NUMBER() {
        return process.env.TWILIO_PHONE_NUMBER;
    },
    get PRIMETRUSTAPI_URL() {
        return process.env.PRIMETRUSTAPI_URL;
    },
    get PLAID_CLIENT_ID() {
        return process.env.PLAID_CLIENT_ID;
    },
    get PLAID_SECRET() {
        return process.env.PLAID_SECRET;
    },
    get PLAID_ENV() {
        return process.env.PLAID_ENV;
    },
};
//# sourceMappingURL=index.js.map