"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuizResult = void 0;
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
    pointsEarned: {
        type: mongoose_1.default.Schema.Types.Number,
        required: true,
    },
}, {
    timestamps: true,
});
exports.QuizResult = mongoose_1.default.model("quizResult", schema);
//# sourceMappingURL=quizResult.js.map