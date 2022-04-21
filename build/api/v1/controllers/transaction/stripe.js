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
class StripeController extends base_1.default {
    async chargeWithStripe(ctx) {
        const { id, hash } = ctx.body;
        return this.Ok(ctx, { message: "success" });
    }
    async getStripeConfig(ctx) {
        return this.Ok(ctx, { stripePK: config_1.default.STRIPE_PUBLISHABLE_KEY });
    }
}
__decorate([
    (0, utility_1.Route)({ path: "/stripe/charge", method: types_1.HttpMethod.POST })
], StripeController.prototype, "chargeWithStripe", null);
__decorate([
    (0, utility_1.Route)({ path: "/stripe/config", method: types_1.HttpMethod.GET })
], StripeController.prototype, "getStripeConfig", null);
exports.default = new StripeController();
//# sourceMappingURL=stripe.js.map