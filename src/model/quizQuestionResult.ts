import mongoose from "mongoose";

import type { IQuizQuestionResult, MongooseModel } from "@app/types";

export type IQuizQuestionResultSchema = MongooseModel<IQuizQuestionResult> &
  mongoose.Document;

const schema = new mongoose.Schema<IQuizQuestionResultSchema>(
  {
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "quizTopic",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "quiz",
      required: true,
    },
    quizQuestionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "quizQuestion",
      required: true,
    },
    pointsEarned: {
      type: mongoose.Schema.Types.Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export const QuizQuestionResult = mongoose.model<IQuizQuestionResultSchema>(
  "quizQuestionResult",
  schema
);
