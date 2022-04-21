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
const middleware_1 = require("@app/middleware");
const model_1 = require("@app/model");
const types_1 = require("@app/types");
const utility_1 = require("@app/utility");
const base_1 = __importDefault(require("./base"));
class CMSController extends base_1.default {
    async getCMS(ctx) {
        if (!ctx.request.params.type) {
            return this.BadRequest(ctx, "Invalid Type");
        }
        const cms = await model_1.CMSTable.findOne({ type: ctx.request.params.type });
        if (!cms)
            return this.BadRequest(ctx, "Enter valid CMS type");
        return this.Ok(ctx, cms, true);
    }
}
__decorate([
    (0, middleware_1.Auth)(),
    (0, utility_1.Route)({ path: "/get-cms/:type", method: types_1.HttpMethod.GET })
], CMSController.prototype, "getCMS", null);
exports.default = new CMSController();
//# sourceMappingURL=cms.js.map