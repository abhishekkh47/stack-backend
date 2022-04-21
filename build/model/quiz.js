"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuizTable = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const schema = new mongoose_1.default.Schema({
    quizName: { type: mongoose_1.default.Schema.Types.String, required: true },
    topicId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "quizTopic",
    },
    videoUrl: { type: mongoose_1.default.Schema.Types.String, default: null },
}, { timestamps: true });
exports.QuizTable = mongoose_1.default.model("quiz", schema, "quiz");
//# sourceMappingURL=quiz.js.map