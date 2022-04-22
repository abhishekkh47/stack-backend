import mongoose from "mongoose";

import type { IQuiz, MongooseModel } from "../types";

export type IQuizSchema = MongooseModel<IQuiz> & mongoose.Document;

const schema = new mongoose.Schema<IQuizSchema>(
  {
    quizName: { type: mongoose.Schema.Types.String, required: true },
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "quizTopic",
    },
    videoUrl: { type: mongoose.Schema.Types.String, default: null },
  },
  { timestamps: true }
);

export const QuizTable = mongoose.model<IQuizSchema>("quiz", schema, "quiz");
