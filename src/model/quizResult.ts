import mongoose from "mongoose";

import type { IQuizResult, MongooseModel } from "@app/types";

export type IQuizResultSchema = MongooseModel<IQuizResult> & mongoose.Document;

const schema = new mongoose.Schema<IQuizResultSchema>(
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
    pointsEarned: {
      type: mongoose.Schema.Types.Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);
export const QuizResult = mongoose.model<IQuizResultSchema>(
  "quizResult",
  schema
);
