"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CryptoTable = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const schema = new mongoose_1.default.Schema({
    name: {
        type: mongoose_1.default.Schema.Types.String,
        required: true,
        unique: true,
    },
    image: {
        type: mongoose_1.default.Schema.Types.String,
        default: null,
    },
}, { timestamps: true });
exports.CryptoTable = mongoose_1.default.model("crypto", schema);
//# sourceMappingURL=crypto.js.map