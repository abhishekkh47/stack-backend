"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideosTable = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const schema = new mongoose_1.default.Schema({
    videoCategory: { type: mongoose_1.default.Schema.Types.String, required: true },
    status: { type: mongoose_1.default.Schema.Types.Number, default: 1 },
    videoList: [
        {
            title: {
                type: mongoose_1.default.Schema.Types.String,
                required: true,
            },
            thumbnail: {
                type: mongoose_1.default.Schema.Types.String,
                default: null,
            },
            position: {
                type: mongoose_1.default.Schema.Types.Number,
                required: true,
            },
            url: {
                type: mongoose_1.default.Schema.Types.String,
                required: true,
            },
        },
    ],
}, { timestamps: true });
exports.VideosTable = mongoose_1.default.model("video", schema);
//# sourceMappingURL=videos.js.map