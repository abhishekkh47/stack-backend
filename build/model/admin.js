"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminTable = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const schema = new mongoose_1.default.Schema({
    email: {
        type: mongoose_1.default.Schema.Types.String,
        required: false,
        default: null,
    },
    username: { type: mongoose_1.default.Schema.Types.String, required: true },
    jwtToken: { type: mongoose_1.default.Schema.Types.String, default: null },
}, { timestamps: true });
exports.AdminTable = mongoose_1.default.model("admin", schema, "admin");
//# sourceMappingURL=admin.js.map