import mongoose from "mongoose";

import type { IBusinessProfile, MongooseModel } from "@app/types";

export type IBusinessProfileSchema = MongooseModel<IBusinessProfile> &
  mongoose.Document;

const schema = new mongoose.Schema<IBusinessProfileSchema>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
      ref: "user",
    },
    impacts: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "impact",
    },
    passions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "passion",
      },
    ],
    description: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    streakGoal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "streakgoal",
      default: null,
    },
    streaks: {
      longestStreak: {
        type: mongoose.Schema.Types.Number,
        default: 0,
      },
      currentStreak: {
        type: mongoose.Schema.Types.Number,
        default: 0,
      },
      updatedStreakDate: {
        type: mongoose.Schema.Types.String,
        default: 0,
      },
    },
  },
  { timestamps: true }
);
export const BusinessProfileTable = mongoose.model<IBusinessProfileSchema>(
  "business-profile",
  schema
);
