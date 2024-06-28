import mongoose from "mongoose";

import type { IDailyChallenge, MongooseModel } from "@app/types";

export type IDailyChallengeSchema = MongooseModel<IDailyChallenge> &
  mongoose.Document;
const schema = new mongoose.Schema<IDailyChallenge>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "user",
    },
    dailyGoalStatus: [
      {
        id: {
          type: mongoose.Schema.Types.String,
          required: true,
          default: null,
        },
        title: {
          type: mongoose.Schema.Types.String,
          required: true,
          default: null,
        },
        key: {
          type: mongoose.Schema.Types.String,
          required: true,
          default: null,
        },
        time: {
          type: mongoose.Schema.Types.String,
          required: true,
          default: null,
        },
        isCompleted: {
          type: mongoose.Schema.Types.Boolean,
          default: false,
        },
        categoryId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "quiz_categories",
        },
      },
    ],
  },
  { timestamps: true }
);
export const DailyChallengeTable = mongoose.model<IDailyChallenge>(
  "daily_challenge",
  schema
);
