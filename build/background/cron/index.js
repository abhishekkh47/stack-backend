"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startCron = void 0;
const types_1 = require("@app/types");
const node_cron_1 = __importDefault(require("node-cron"));
const agenda_1 = require("../agenda");
const startCron = () => {
    node_cron_1.default.schedule("0 0 0 * * *", async () => {
        await (0, agenda_1.scheduleJob)("now", types_1.EJOBS.EXPIRE_GIFT_CARDS);
    });
};
exports.startCron = startCron;
//# sourceMappingURL=index.js.map