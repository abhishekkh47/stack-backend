"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const stripe_1 = __importDefault(require("stripe"));
const config_1 = __importDefault(require("@app/config"));
const utility_1 = require("@app/utility");
class StripeService {
    constructor() {
        this.client = new stripe_1.default(config_1.default.STRIPE_SECRET_KEY, {
            apiVersion: "2020-08-27",
        });
    }
    async chargeWithPaymentIntent({ id, amount, description = "", }) {
        const response = await this.client.paymentIntents.create({
            amount,
            currency: "USD",
            description,
            payment_method: id,
            confirm: true,
        });
        utility_1.logger.log("info", response);
        return response;
    }
}
exports.default = StripeService;
//# sourceMappingURL=stripe.service.js.map