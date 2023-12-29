import mongoose from "mongoose";

import type { IQuizReview, MongooseModel } from "@app/types";

export type IQuizReviewSchema = MongooseModel<any> & mongoose.Document;

const schema = new mongoose.Schema<IQuizReviewSchema>(
  {
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
    quizName: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    /**
     * Difficulty level must be from 1 to 5 only
     */
    difficultyLevel: {
      type: mongoose.Schema.Types.Number,
      enum: [1, 2, 3, 4, 5],
      required: false,
      default: null, //Here null means not given review yet
    },
    /**
     * Fun level must be from 1 to 5 only
     */
    funLevel: {
      type: mongoose.Schema.Types.Number,
      enum: [1, 2, 3, 4, 5],
      required: false,
      default: null, //Here null means not given review yet
    },
    /**
     * Want more 0 - no and 1 - yes
     */
    wantMore: {
      type: mongoose.Schema.Types.Number,
      enum: [0, 1],
      required: false,
      default: null, //Here null means not given review yet
    },
    ratings: {
      type: mongoose.Schema.Types.Number,
      enum: [1, 2, 3, 4, 5],
      required: false,
      default: null,
    },
    feedback: {
      type: mongoose.Schema.Types.Array,
      required: false,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);
export const QuizReview = mongoose.model<IQuizReviewSchema>(
  "quizReview",
  schema
);
