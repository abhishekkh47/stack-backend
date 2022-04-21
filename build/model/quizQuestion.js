"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuizQuestionTable = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const schema = new mongoose_1.default.Schema({
    text: { type: mongoose_1.default.Schema.Types.String, required: true },
    quizId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        required: true,
        ref: "quiz",
    },
    points: {
        type: mongoose_1.default.Schema.Types.Number,
        required: true,
    },
    question_type: {
        type: mongoose_1.default.Schema.Types.Number,
        required: true,
    },
    answer_type: {
        type: mongoose_1.default.Schema.Types.Number,
        default: 1,
    },
    answer_array: [
        {
            name: {
                type: mongoose_1.default.Schema.Types.String,
                required: true,
            },
            correct_answer: {
                type: mongoose_1.default.Schema.Types.Number,
                required: true,
            },
        },
    ],
}, { timestamps: true });
exports.QuizQuestionTable = mongoose_1.default.model("quizQuestion", schema);
//# sourceMappingURL=quizQuestion.js.map