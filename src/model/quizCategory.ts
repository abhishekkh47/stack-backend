import mongoose from "mongoose";

import type { IQuizCategory, MongooseModel } from "@app/types";

export type IQuizCategorySchema = MongooseModel<IQuizCategory> &
  mongoose.Document;

const schema = new mongoose.Schema<IQuizCategorySchema>(
  {
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "quizTopic",
      default: null,
    },
    order: {
      type: mongoose.Schema.Types.Number,
      required: true,
      default: 0,
    },
    title: {
      type: mongoose.Schema.Types.String,
      required: true,
      default: null,
    },
    description: {
      type: mongoose.Schema.Types.String,
      required: true,
      default: null,
    },
  },
  { timestamps: true }
);

export const QuizCategoryTable = mongoose.model<IQuizCategorySchema>(
  "quiz_category",
  schema
);
