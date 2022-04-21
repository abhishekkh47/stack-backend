"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const src_1 = __importDefault(require("circle-sdk/src"));
const openpgp = __importStar(require("openpgp"));
const atob_1 = __importDefault(require("atob"));
const btoa_1 = __importDefault(require("btoa"));
const uuid_1 = require("uuid");
const config_1 = __importDefault(require("@app/config"));
const nanoid_1 = require("nanoid");
class CircleService {
    constructor() {
        this.disable = process.env.DISABLE_CIRCLE || true;
        this.client = new src_1.default({
            apiKey: config_1.default.CIRCLE_API_KEY,
            baseUrl: config_1.default.CIRCLE_BASE_URL,
        });
        this.registerWebhook();
    }
    async registerWebhook() {
        if (config_1.default.CIRCLE_WEBHOOK_URL) {
            const response = await this.client.subscription.list();
            if (!response.data.find((x) => x.endpoint === config_1.default.CIRCLE_WEBHOOK_URL)) {
                response.data.forEach(({ id }) => {
                    this.client.subscription.remove(id);
                });
                console.log(await this.client.subscription.create({
                    endpoint: config_1.default.CIRCLE_WEBHOOK_URL,
                }));
            }
        }
    }
    async encrypt(dataToEncrypt) {
        const response = (await this.client.encryption.getPublicKey());
        const { keyId, publicKey } = response.data;
        const decodedPublicKey = (0, atob_1.default)(publicKey);
        const encryptedData = await openpgp.encrypt({
            encryptionKeys: [await openpgp.readKey({ armoredKey: decodedPublicKey })],
            message: await openpgp.createMessage({
                text: JSON.stringify(dataToEncrypt),
            }),
        });
        return {
            encryptedData: (0, btoa_1.default)(encryptedData),
            keyId,
        };
    }
    async createCard(payload) {
        try {
            const { number, cvv } = payload, rest = __rest(payload, ["number", "cvv"]);
            const { encryptedData, keyId } = await this.encrypt({
                cvv,
                number: number.trim().replace(/\D/g, ""),
            });
            const response = await this.client.card.create({
                encryptedData: encryptedData,
                keyId,
                billingDetails: rest.billingDetails,
                expMonth: rest.expMonth,
                expYear: rest.expYear,
                idempotencyKey: (0, uuid_1.v4)(),
                metadata: rest.metadata,
            });
            return response.data;
        }
        catch (err) {
            console.log(err);
            throw new Error("Invalid card details");
        }
    }
    async chargePaymentByCard(body) {
        if (this.disable) {
            return {
                cardId: (0, nanoid_1.nanoid)(),
                data: {
                    id: (0, nanoid_1.nanoid)(),
                },
            };
        }
        const { amount } = body, rest = __rest(body, ["amount"]);
        let id = "";
        try {
            const response = await this.createCard(rest);
            console.log("card create", response);
            id = response.id;
        }
        catch (err) {
            throw new Error(err.message);
        }
        try {
            const payload = {
                amount: {
                    amount: amount,
                    currency: "USD",
                },
                idempotencyKey: (0, uuid_1.v4)(),
                metadata: rest.metadata,
                verification: "cvv",
                source: {
                    id,
                    type: "card",
                },
            };
            const response = await this.client.payments.create(payload);
            console.log("payments create", response);
            return Object.assign(Object.assign({}, response), { cardId: id });
        }
        catch (err) {
            console.log(err);
            throw new Error("Payment failed");
        }
    }
    async sendMoney(body) {
        if (this.disable) {
            return (0, nanoid_1.nanoid)();
        }
        const walletId = await this.getPrimaryWallet();
        const response = await this.client.transfer.create({
            amount: body.amount,
            destination: body.destination,
            idempotencyKey: (0, uuid_1.v4)(),
            source: {
                id: walletId,
                type: "wallet",
            },
        });
        return response === null || response === void 0 ? void 0 : response.data.id;
    }
    async getPayment(paymentId) {
        if (this.disable) {
            return {
                data: {
                    status: "success",
                },
            };
        }
        return (await this.client.payments.retrieve(paymentId));
    }
    async getPrimaryWallet() {
        const wallets = await this.client.wallet.list({});
        const primaryWallet = (wallets.data || []).find((x) => x.type === "merchant");
        return primaryWallet === null || primaryWallet === void 0 ? void 0 : primaryWallet.walletId;
    }
}
exports.default = CircleService;
//# sourceMappingURL=cirlce.service.js.map