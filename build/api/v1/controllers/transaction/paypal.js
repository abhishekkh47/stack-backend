"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("@app/types");
const utility_1 = require("@app/utility");
const base_1 = __importDefault(require("./base"));
const config_1 = __importDefault(require("@app/config"));
class PaypalController extends base_1.default {
    async createPaypalTransaction(ctx) {
    }
    async capturePaypalTransaction(ctx) {
    }
    async getPaypalConfig(ctx) {
        return this.Ok(ctx, { clientId: config_1.default.PAYPAL_CLIENT_ID });
    }
}
__decorate([
    (0, utility_1.Route)({ path: "/paypal/create-transaction", method: types_1.HttpMethod.POST })
], PaypalController.prototype, "createPaypalTransaction", null);
__decorate([
    (0, utility_1.Route)({ path: "/paypal/capture-transaction", method: types_1.HttpMethod.POST })
], PaypalController.prototype, "capturePaypalTransaction", null);
__decorate([
    (0, utility_1.Route)({ path: "/paypal/config", method: types_1.HttpMethod.GET })
], PaypalController.prototype, "getPaypalConfig", null);
exports.default = new PaypalController();
//# sourceMappingURL=paypal.js.map