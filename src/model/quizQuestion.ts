import mongoose from "mongoose";

import type { IQuizQuestion, MongooseModel } from "../types";

export type IQuizQuestionSchema = MongooseModel<IQuizQuestion> &
  mongoose.Document;

const schema = new mongoose.Schema<IQuizQuestionSchema>(
  {
    text: { type: mongoose.Schema.Types.String, required: true },
    question_image: {
      type: mongoose.Schema.Types.String,
      default: null,
    },
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "quiz",
      default: null
    },
    points: {
      type: mongoose.Schema.Types.Number,
      required: true,
    },
    /**
     * 1 - BEST_ANSWER, 2 - FILL_IN_BLANKS , 3 - TRUE_FALSE,
     */
    question_type: {
      type: mongoose.Schema.Types.Number,
      required: true,
    },
    /**
     * 1 - TEXT and 2 - IMAGE
     */
    answer_type: {
      type: mongoose.Schema.Types.Number,
      default: 1,
    },
    answer_array: [
      {
        name: {
          type: mongoose.Schema.Types.String,
          required: false,
        },
        image: {
          type: mongoose.Schema.Types.String,
          default: null,
        },
        /**
         * 1 - True and  0 - False
         */
        correct_answer: {
          type: mongoose.Schema.Types.Number,
          required: true,
        },
        statement: {
          type: mongoose.Schema.Types.String,
          default: null,
        },
      },
    ],
    /**
     * False: not onboarding, True: on boarding
     */
    isOnboardingFlowQuiz: {
      type: mongoose.Schema.Types.Boolean,
      default: false
    },
    question_image_title: {
      type: mongoose.Schema.Types.String,
      default: null,
    }
  },
  { timestamps: true }
);

export const QuizQuestionTable = mongoose.model<IQuizQuestionSchema>(
  "quizQuestion",
  schema
);
