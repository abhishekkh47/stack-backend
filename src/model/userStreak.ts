import mongoose from "mongoose";

import type { IUserStreaks, MongooseModel } from "@app/types";

export type IUserStreakSchema = MongooseModel<IUserStreaks> & mongoose.Document;

const schema = new mongoose.Schema<IUserStreakSchema>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    /**
     * Format (YYYY-MM-DD)
     */
    streakDate: {
      type: mongoose.Schema.Types.String,
      default: null,
    },
  },
  { timestamps: true }
);

export const UserStreakTable = mongoose.model<IUserStreakSchema>(
  "userstreak",
  schema
);
