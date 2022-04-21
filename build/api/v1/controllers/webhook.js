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
const utility_1 = require("@app/utility");
const base_1 = __importDefault(require("./base"));
const types_1 = require("@app/types");
class WebhookController extends base_1.default {
    CircleWebhookGet(ctx) {
        this.Ok(ctx, {
            status: "ok",
            timestamp: Date.now(),
        });
    }
    CircleWebhookPost(ctx) {
        this.Ok(ctx, {
            status: "ok",
            timestamp: Date.now(),
        });
    }
}
__decorate([
    (0, utility_1.Route)("/webhook/circle", types_1.HttpMethod.GET)
], WebhookController.prototype, "CircleWebhookGet", null);
__decorate([
    (0, utility_1.Route)("/webhook/circle", types_1.HttpMethod.POST)
], WebhookController.prototype, "CircleWebhookPost", null);
exports.default = new WebhookController();
//# sourceMappingURL=webhook.js.map