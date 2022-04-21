"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentTransactionTable = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const schema = new mongoose_1.default.Schema({
    giftCardId: {
        type: mongoose_1.default.Schema.Types.String,
        required: true,
        ref: "gift-card",
    },
    data: { type: mongoose_1.default.Schema.Types.Mixed, required: false, default: {} },
    method: { type: mongoose_1.default.Schema.Types.String, required: true },
    paymentMode: {
        type: mongoose_1.default.Schema.Types.String,
        required: true,
        default: "IN",
    },
}, { timestamps: true });
exports.PaymentTransactionTable = mongoose_1.default.model("payment-transaction", schema);
//# sourceMappingURL=payment-transaction.js.map