"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtpTable = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const schema = new mongoose_1.default.Schema({
    receiverMobile: { type: mongoose_1.default.Schema.Types.String, required: true },
    isVerified: { type: mongoose_1.default.Schema.Types.Number, default: 0 },
    code: {
        type: mongoose_1.default.Schema.Types.Number,
        required: true,
    },
    message: {
        type: mongoose_1.default.Schema.Types.String,
        required: true,
    },
    type: { type: mongoose_1.default.Schema.Types.Number, required: true },
}, { timestamps: true });
exports.OtpTable = mongoose_1.default.model("otp", schema);
//# sourceMappingURL=otp.js.map