import mongoose from "mongoose";

import type { IWeeklyJourneyResults, MongooseModel } from "@app/types";

export type IWeeklyJourneyResultsSchema = MongooseModel<IWeeklyJourneyResults> &
  mongoose.Document;
const schema = new mongoose.Schema<IWeeklyJourneyResults>(
  {
    weeklyJourneyId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
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
export const WeeklyJourneyResultsTable = mongoose.model<IWeeklyJourneyResults>(
  "weekly_journey_results",
  schema
);
