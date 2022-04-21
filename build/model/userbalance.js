"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserWalletTable = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const schema = new mongoose_1.default.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "users",
        required: true,
    },
    balance: {
        type: mongoose_1.default.Schema.Types.Number,
        required: true,
    },
}, { timestamps: true });
exports.UserWalletTable = mongoose_1.default.model("userbalance", schema, "userwallet");
//# sourceMappingURL=userbalance.js.map