import mongoose from "mongoose";

import type { IQuizReview, MongooseModel } from "@app/types";

export type IQuizReviewSchema = MongooseModel<IQuizReview> & mongoose.Document;

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
      type: String,
      required: true,
    },
    /**
     * Difficulty level must be from 1 to 5 only
     */
    difficultyLevel: {
      type: Number,
      enum: [1, 2, 3, 4, 5],
      required: true,
    },
    /**
     * Fun level must be from 1 to 5 only
     */
    funLevel: {
      type: Number,
      enum: [1, 2, 3, 4, 5],
      required: true,
    },
    /**
     * Want more 0 - no and 1 - yes
     */
    wantMore: {
      type: Number,
      enum: [0, 1],
      required: true,
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
