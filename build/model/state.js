"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateTable = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const schema = new mongoose_1.default.Schema({
    name: { type: mongoose_1.default.Schema.Types.String },
    shortName: { type: mongoose_1.default.Schema.Types.String },
}, { timestamps: true });
exports.StateTable = mongoose_1.default.model("state", schema);
//# sourceMappingURL=state.js.map