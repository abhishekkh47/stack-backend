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
const nanoid_1 = require("nanoid");
const utility_1 = require("@app/utility");
const base_1 = __importDefault(require("./base"));
const types_1 = require("@app/types");
const model_1 = require("@app/model");
const services_1 = require("@app/services");
const middleware_1 = require("@app/middleware");
const circle = null;
class GiftCardController extends base_1.default {
    async getGiftCards(ctx) {
        const user = ctx.request.user;
        const gifts = await model_1.GiftsTable.find({ owner: user._id }).sort({
            createdAt: -1,
        });
        return this.Ok(ctx, {
            data: gifts,
            count: gifts.length,
        });
    }
    async getGiftCardStatus(ctx) {
        var _a;
        const paymentId = ctx.request.query.paymentId;
        const response = (await circle.getPayment(paymentId)) || null;
        return this.Ok(ctx, {
            status: (_a = response === null || response === void 0 ? void 0 : response.data) === null || _a === void 0 ? void 0 : _a.status,
        });
    }
    async addGiftCard(ctx) {
        const { amount, deliveryDate, delivery, message, sender, receiver, senderEmail, } = ctx.request.body;
    }
    async verifyGiftCard(ctx) {
        const { hash } = ctx.request.query;
        return this.Ok(ctx, {
            status: true,
            message: "Gift Card verified successfully",
        });
    }
    async getAllGiftCard(ctx) {
        const data = await model_1.GiftsTable.find({});
        return this.Ok(ctx, data);
    }
    async verifyGift(ctx) {
        const { hash } = ctx.request.query;
        const data = await model_1.GiftsTable.findOne({ hash });
        return this.Ok(ctx, data);
    }
    async sendOtp(ctx) {
        const { number, email } = (ctx.request.body);
        const notificationClient = new services_1.NotificationService();
        const generateCode = (0, nanoid_1.customAlphabet)("1234567890", 6);
        const otp = generateCode();
        await (0, utility_1.saveOtp)(number, otp);
        await notificationClient.sendSms(number, `Your Stack Verification code is ${otp}`, email);
        return this.Ok(ctx, { success: true, message: "Otp sent" });
    }
    async verifyGiftCardOtp(ctx) {
        const { otp, number } = ctx.request.body;
        (0, utility_1.validateOtp)(number, otp);
        return this.Ok(ctx, { success: true, message: "Otp verified" });
    }
    async createQrCode(ctx) {
        const user = ctx.request.user;
        const payload = ctx.request.body;
        const hash = (0, utility_1.generateHash)(JSON.stringify(Object.assign(Object.assign({}, payload), { createdAt: new Date().getTime() })));
        await model_1.QrCodeTable.create(Object.assign(Object.assign({}, payload), { hash, owner: user === null || user === void 0 ? void 0 : user._id }));
        return this.Ok(ctx, { success: true, hash });
    }
    async getQrCode(ctx) {
        const { id } = ctx.request.query;
        const data = await model_1.QrCodeTable.findOne({ hash: id });
        return this.Ok(ctx, {
            success: !!data,
            data,
        });
    }
    async getQrCodes(ctx) {
        const { _id } = ctx.request.user;
        const data = await model_1.QrCodeTable.find({ owner: _id });
        return this.Ok(ctx, {
            data,
            count: data.length,
        });
    }
    async reactivateGiftCard(ctx) {
        const { hash, deliveryDate } = ctx.request.body;
        return this.Ok(ctx, { message: "Gift Card re-activated." });
    }
    async getGiftCardIfExists(hash) {
    }
}
__decorate([
    (0, utility_1.Route)({ path: "/gift-card", method: types_1.HttpMethod.GET }),
    (0, middleware_1.Auth)()
], GiftCardController.prototype, "getGiftCards", null);
__decorate([
    (0, utility_1.Route)({ path: "/gift-card/status", method: types_1.HttpMethod.GET }),
    (0, middleware_1.Auth)()
], GiftCardController.prototype, "getGiftCardStatus", null);
__decorate([
    (0, utility_1.Route)({ path: "/gift-card", method: types_1.HttpMethod.POST })
], GiftCardController.prototype, "addGiftCard", null);
__decorate([
    (0, utility_1.Route)({ path: "/gift-card-verify", method: types_1.HttpMethod.GET })
], GiftCardController.prototype, "verifyGiftCard", null);
__decorate([
    (0, utility_1.Route)({ path: "/gifts", method: types_1.HttpMethod.GET })
], GiftCardController.prototype, "getAllGiftCard", null);
__decorate([
    (0, utility_1.Route)({ path: "/gift", method: types_1.HttpMethod.GET })
], GiftCardController.prototype, "verifyGift", null);
__decorate([
    (0, utility_1.Route)({ path: "/gift/send-otp", method: types_1.HttpMethod.POST })
], GiftCardController.prototype, "sendOtp", null);
__decorate([
    (0, utility_1.Route)({ path: "/gift/verify-otp", method: types_1.HttpMethod.POST })
], GiftCardController.prototype, "verifyGiftCardOtp", null);
__decorate([
    (0, utility_1.Route)({ path: "/qr-code", method: types_1.HttpMethod.POST }),
    (0, middleware_1.Auth)()
], GiftCardController.prototype, "createQrCode", null);
__decorate([
    (0, utility_1.Route)({ path: "/qr-code", method: types_1.HttpMethod.GET })
], GiftCardController.prototype, "getQrCode", null);
__decorate([
    (0, utility_1.Route)({ path: "/qr-codes", method: types_1.HttpMethod.GET }),
    (0, middleware_1.Auth)()
], GiftCardController.prototype, "getQrCodes", null);
__decorate([
    (0, utility_1.Route)({ path: "/gift-card-reactivate", method: types_1.HttpMethod.PUT })
], GiftCardController.prototype, "reactivateGiftCard", null);
exports.default = new GiftCardController();
//# sourceMappingURL=gift-cards.js.map