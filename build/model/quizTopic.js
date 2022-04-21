"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuizTopicTable = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const schema = new mongoose_1.default.Schema({
    topic: { type: mongoose_1.default.Schema.Types.String, required: true },
    status: { type: mongoose_1.default.Schema.Types.Number, default: 1 },
}, { timestamps: true });
exports.QuizTopicTable = mongoose_1.default.model("quizTopic", schema);
//# sourceMappingURL=quizTopic.js.map