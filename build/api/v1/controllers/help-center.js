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
const constants_1 = require("@app/utility/constants");
class HelpCenterController extends base_1.default {
    async sendIssue(ctx) {
        const reqParam = ctx.request.body;
        return apiValidation_1.validation.sendIssueInputValidation(reqParam, ctx, async (validate) => {
            if (validate) {
                const { email, mobile, issue } = reqParam;
                if (!email && !mobile)
                    return this.BadRequest(ctx, "Email or Contact number not found.");
                let userType;
                if (email)
                    userType = await model_1.UserTable.findOne({ email }, { type: 1, _id: 0 });
                else
                    userType = await model_1.UserTable.findOne({ mobile }, { type: 1, _id: 0 });
                if (!userType)
                    return this.BadRequest(ctx, "Invalid Email or Moblie number");
                const data = {
                    email: email ? email : "N/A",
                    mobile: mobile ? mobile : "N/A",
                    type: userType.type == 1 ? "TEEN" : "PARENT",
                    issue,
                    subject: "Help Center Request",
                };
                const admin = await model_1.AdminTable.findOne({});
                (0, utility_1.sendEmail)(admin.email, constants_1.CONSTANT.HelpCenterTemplateId, data);
                return this.Ok(ctx, {
                    message: "Hang tight! We will reach out to you ASAP",
                });
            }
        });
    }
}
__decorate([
    (0, utility_1.Route)({ path: "/send-issue", method: types_1.HttpMethod.POST })
], HelpCenterController.prototype, "sendIssue", null);
exports.default = new HelpCenterController();
//# sourceMappingURL=help-center.js.map