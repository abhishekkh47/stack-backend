import mongoose from "mongoose";

import type { IWeeklyJourneyResult, MongooseModel } from "@app/types";

export type IWeeklyJourneyResultSchema = MongooseModel<IWeeklyJourneyResult> &
  mongoose.Document;
const schema = new mongoose.Schema<IWeeklyJourneyResult>(
  {
    weeklyJourneyId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "weekly_journey",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "user",
    },
    actionNum: {
      type: mongoose.Schema.Types.Number,
      required: true,
    },
    actionInput: {
      type: mongoose.Schema.Types.String,
      default: null,
    },
  },
  { timestamps: true }
);
export const WeeklyJourneyResultTable = mongoose.model<IWeeklyJourneyResult>(
  "weekly_journey_result",
  schema
);
