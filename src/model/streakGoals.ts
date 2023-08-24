import mongoose from "mongoose";

import type { IStreakGoal, MongooseModel } from "@app/types";

export type IStreakGoalSchema = MongooseModel<IStreakGoal> & mongoose.Document;

const schema = new mongoose.Schema<IStreakGoalSchema>(
  {
    day: { type: mongoose.Schema.Types.Number, required: true },
    title: { type: mongoose.Schema.Types.String, required: true },
  },
  { timestamps: true }
);

export const StreakGoalTable = mongoose.model<IStreakGoalSchema>(
  "streakgoal",
  schema
);
