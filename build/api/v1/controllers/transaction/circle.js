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
const model_1 = require("@app/model");
const middleware_1 = require("@app/middleware");
const circle = null;
class CircleController extends base_1.default {
    async getSupportedChains(ctx) {
        const chains = [
            {
                name: "Ethereum",
                code: "ETH",
                currency: "USD",
            },
            {
                name: "Algorand",
                code: "ALGO",
                currency: "USD",
            },
            {
                name: "Solana",
                code: "SOL",
                currency: "USD",
            },
            {
                name: "Stellar",
                code: "XLM",
                currency: "USD",
            },
            {
                name: "TRON",
                code: "TRX",
                currency: "USD",
            },
            {
                name: "Hedera",
                code: "HBAR",
                currency: "USD",
            },
        ];
        return this.Ok(ctx, chains);
    }
    async createCard(ctx) {
        const user = ctx.request.user;
        try {
            const body = ctx.request.body;
            const chargePaymentBody = {
                amount: body.amount,
                metadata: body.metadata,
                number: body.number,
                cvv: body.cvv,
                expMonth: body.expMonth,
                expYear: body.expYear,
                billingDetails: body.billingDetails,
            };
            const response = await circle.chargePaymentByCard(chargePaymentBody);
            const giftCard = await model_1.GiftsTable.create({
                amount: body.amount,
                currency: "$",
                giftType: body.giftType,
                from: body.from,
                deliveryDate: body.deliveryDate,
                message: body.message,
                templateUrl: body.templateUrl,
                senderEmail: body.senderEmail,
                senderMobile: body.senderMobile,
                receiverEmail: body.receiverEmail,
                receiverNumber: body.receiverNumber,
                paymentId: response.data.id,
                cardId: response.cardId,
                qrId: body.qrId || "",
                hash: (0, utility_1.generateHash)(JSON.stringify({
                    amount: body.amount,
                    sender: body.senderEmail,
                    receiver: body.receiverEmail,
                    type: body.giftType,
                    paymentId: response.data.id,
                })),
                owner: user._id,
            });
            this.onPaymentSuccess(giftCard);
            return this.Ok(ctx, { id: giftCard.hash, success: true });
        }
        catch (err) {
            return this.Ok(ctx, { success: false, message: err.message });
        }
    }
    async handleSendMoney(ctx) {
        var _a, _b;
        const user = ctx.request.user;
        const payload = ctx.request.body;
        const gift = await model_1.GiftsTable.findOne({ _id: payload._id });
        if (!gift) {
            throw new Error("No gift card exists");
        }
        if (gift.transferId) {
            throw new Error("Payment already initiated.");
        }
        const transferId = await circle.sendMoney({
            destination: {
                type: "blockchain",
                address: (_a = payload === null || payload === void 0 ? void 0 : payload.destination) === null || _a === void 0 ? void 0 : _a.address,
                chain: (_b = payload === null || payload === void 0 ? void 0 : payload.destination) === null || _b === void 0 ? void 0 : _b.chain,
            },
            amount: {
                amount: gift.amount,
                currency: "USD",
            },
        });
        await gift.updateOne({ transferId, receiverId: user._id });
        return this.Ok(ctx, { success: true, message: "Transfer initiated" });
    }
}
__decorate([
    (0, utility_1.Route)({ path: "/circle/supported-chains", method: types_1.HttpMethod.GET })
], CircleController.prototype, "getSupportedChains", null);
__decorate([
    (0, utility_1.Route)({ path: "/circle/send-gift", method: types_1.HttpMethod.POST }),
    (0, middleware_1.Auth)()
], CircleController.prototype, "createCard", null);
__decorate([
    (0, utility_1.Route)({ path: "/circle/send-money", method: types_1.HttpMethod.POST }),
    (0, middleware_1.Auth)()
], CircleController.prototype, "handleSendMoney", null);
exports.default = new CircleController();
//# sourceMappingURL=circle.js.map