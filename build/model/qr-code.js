"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QrCodeTable = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const schema = new mongoose_1.default.Schema({
    address: { type: mongoose_1.default.Schema.Types.String, required: false },
    chain: { type: mongoose_1.default.Schema.Types.String, required: false },
    email: { type: mongoose_1.default.Schema.Types.String, required: false },
    mobileNumber: { type: mongoose_1.default.Schema.Types.String, required: false },
    type: { type: mongoose_1.default.Schema.Types.String, required: false },
    hash: { type: mongoose_1.default.Schema.Types.String, required: false },
    owner: { type: mongoose_1.default.Schema.Types.String, required: false },
}, { timestamps: true });
exports.QrCodeTable = mongoose_1.default.model("qr-code", schema);
//# sourceMappingURL=qr-code.js.map