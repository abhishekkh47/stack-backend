"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuizQuestionResult = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const schema = new mongoose_1.default.Schema({
    topicId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "quizTopic",
        required: true,
    },
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "users",
        required: true,
    },
    quizId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "quiz",
        required: true,
    },
    quizQuestionId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "quizQuestion",
        required: true,
    },
    pointsEarned: {
        type: mongoose_1.default.Schema.Types.Number,
        default: 0,
    },
}, { timestamps: true });
exports.QuizQuestionResult = mongoose_1.default.model("quizQuestionResult", schema);
//# sourceMappingURL=quizQuestionResult.js.map