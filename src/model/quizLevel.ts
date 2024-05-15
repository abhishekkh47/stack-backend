import mongoose from "mongoose";

import type { IQuizLevel, MongooseModel } from "@app/types";

export type IQuizLevelSchema = MongooseModel<IQuizLevel> & mongoose.Document;

const schema = new mongoose.Schema<IQuizLevelSchema>(
  {
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "quizTopic",
      default: null,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "quiz_category",
      default: null,
    },
    level: {
      type: mongoose.Schema.Types.Number,
      required: true,
      default: 0,
    },
    title: {
      type: mongoose.Schema.Types.String,
      required: true,
      default: null,
    },
    actions: [
      {
        actionNum: {
          type: mongoose.Schema.Types.Number,
          required: true,
          default: 0,
        },
        quizId: {
          type: mongoose.Schema.Types.ObjectId,
          default: null,
          ref: "quiz",
        },
        quizNum: {
          type: mongoose.Schema.Types.Number,
          required: true,
          default: 0,
        },
        reward: {
          type: mongoose.Schema.Types.Number,
          required: true,
          default: 0,
        },
        type: {
          type: mongoose.Schema.Types.Number,
          required: true,
          default: null,
        },
      },
    ],
  },
  { timestamps: true }
);

export const QuizLevelTable = mongoose.model<IQuizLevelSchema>(
  "quiz_level",
  schema
);
