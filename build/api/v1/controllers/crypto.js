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
const base_1 = __importDefault(require("./base"));
const apiValidation_1 = require("../../../validations/apiValidation");
const utility_1 = require("@app/utility");
const types_1 = require("@app/types");
const model_1 = require("@app/model");
const middleware_1 = require("@app/middleware");
class CryptocurrencyController extends base_1.default {
    async addCrypto(ctx) {
        const input = ctx.request.body;
        return apiValidation_1.validation.addCryptoInputValidation(input, ctx, async (validate) => {
            if (validate) {
                try {
                    const crypto = await model_1.CryptoTable.insertMany(input);
                    this.Created(ctx, {
                        crypto,
                        message: "Crypto added successfully.",
                    });
                }
                catch (error) {
                    this.BadRequest(ctx, "Something went wrong. Please try again.");
                }
            }
        });
    }
    async getCrypto(ctx) {
        const { page, limit } = ctx.request.query;
        const jwtToken = ctx.request.primeTrustToken;
        return apiValidation_1.validation.getAssetValidation(ctx.request.query, ctx, async (validate) => {
            if (validate) {
                const getCryptoData = await (0, utility_1.getAssets)(jwtToken, page, limit);
                if (getCryptoData.status == 400) {
                    return this.BadRequest(ctx, "Asset Not Found");
                }
                return this.Ok(ctx, { message: "Success", data: getCryptoData.data });
            }
        });
    }
}
__decorate([
    (0, utility_1.Route)({ path: "/add-crypto", method: types_1.HttpMethod.POST }),
    (0, middleware_1.Auth)()
], CryptocurrencyController.prototype, "addCrypto", null);
__decorate([
    (0, utility_1.Route)({ path: "/get-crypto", method: types_1.HttpMethod.GET }),
    (0, middleware_1.PrimeTrustJWT)(),
    (0, middleware_1.Auth)()
], CryptocurrencyController.prototype, "getCrypto", null);
exports.default = new CryptocurrencyController();
//# sourceMappingURL=crypto.js.map