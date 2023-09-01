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
    streak: {
      longest: {
        type: mongoose.Schema.Types.Number,
        default: 0,
      },
      current: {
        type: mongoose.Schema.Types.Number,
        default: 0,
      },
      last5days: {
        type: [mongoose.Schema.Types.Mixed], // Assuming you want to store dates
        default: [null, null, null, null, null],
      },
      updatedDate: {
        day: {
          type: mongoose.Schema.Types.Number,
          default: 0,
        },
        month: {
          type: mongoose.Schema.Types.Number,
          default: 0,
        },
        year: {
          type: mongoose.Schema.Types.Number,
          default: 0,
        },
      },
    },
  },
  { timestamps: true }
);
export const BusinessProfileTable = mongoose.model<IBusinessProfileSchema>(
  "business-profile",
  schema
);
