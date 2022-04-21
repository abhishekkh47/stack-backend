"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const checkout_server_sdk_1 = __importDefault(require("@paypal/checkout-server-sdk"));
const config_1 = __importDefault(require("@app/config"));
const utility_1 = require("@app/utility");
class PaypalService {
    constructor() {
        this.clientId = config_1.default.PAYPAL_CLIENT_ID;
        this.clientSecret = config_1.default.PAYPAL_CLIENT_SECRET;
        this.environment = new checkout_server_sdk_1.default.core.SandboxEnvironment(this.clientId, this.clientSecret);
        this.client = new checkout_server_sdk_1.default.core.PayPalHttpClient(this.environment);
    }
    async createOrderRequests({ amount, currencyCode = "USD", }) {
        const createOrderRequest = new checkout_server_sdk_1.default.orders.OrdersCreateRequest();
        createOrderRequest.requestBody({
            intent: "CAPTURE",
            purchase_units: [
                {
                    amount: {
                        currency_code: currencyCode,
                        value: amount,
                    },
                },
            ],
        });
        return await this.executeRequest(createOrderRequest);
    }
    async captureTransaction(orderId) {
        const captureTransactionRequest = new checkout_server_sdk_1.default.orders.OrdersCaptureRequest(orderId);
        captureTransactionRequest.requestBody({});
        return await this.executeRequest(captureTransactionRequest);
    }
    async executeRequest(request) {
        try {
            const response = await this.client.execute(request);
            utility_1.logger.log("info", JSON.stringify(response));
            return response.result;
        }
        catch (err) {
            utility_1.logger.log("error", err);
        }
    }
}
exports.default = PaypalService;
//# sourceMappingURL=paypal.service.js.map