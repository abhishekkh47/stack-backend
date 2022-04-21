"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CMSTable = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const schema = new mongoose_1.default.Schema({
    title: {
        type: mongoose_1.default.Schema.Types.String,
        required: true,
    },
    text: {
        type: mongoose_1.default.Schema.Types.String,
        required: true,
    },
    type: {
        type: mongoose_1.default.Schema.Types.Number,
        required: true,
    },
});
exports.CMSTable = mongoose_1.default.model("CMS", schema, "cms");
//# sourceMappingURL=cms.js.map