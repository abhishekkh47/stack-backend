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
        resultCopyInfo: {
          pass: {
            images: [
              {
                image: {
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
            ],
            resultSummary: [
              {
                title: {
                  type: mongoose.Schema.Types.Number,
                  required: true,
                  default: 0,
                },
                description: {
                  type: mongoose.Schema.Types.String,
                  required: true,
                  default: null,
                },
                icon: {
                  type: mongoose.Schema.Types.String,
                  required: true,
                  default: null,
                },
                type: {
                  type: mongoose.Schema.Types.String,
                  required: true,
                  default: null,
                },
              },
            ],
          },
          fail: {
            images: [
              {
                image: {
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
            ],
            resultSummary: [
              {
                title: {
                  type: mongoose.Schema.Types.Number,
                  required: true,
                  default: 0,
                },
                description: {
                  type: mongoose.Schema.Types.String,
                  required: true,
                  default: null,
                },
                icon: {
                  type: mongoose.Schema.Types.String,
                  required: true,
                  default: null,
                },
                type: {
                  type: mongoose.Schema.Types.String,
                  required: true,
                  default: null,
                },
              },
            ],
          },
        },
      },
    ],
    milestoneId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "milestones",
      default: null,
    },
    day: {
      type: mongoose.Schema.Types.Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true }
);

export const QuizLevelTable = mongoose.model<IQuizLevelSchema>(
  "quiz_level",
  schema
);
