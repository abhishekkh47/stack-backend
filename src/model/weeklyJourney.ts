import mongoose from "mongoose";

import type { IWeeklyJourney, MongooseModel } from "@app/types";

export type IWeeklyJourneySchema = MongooseModel<IWeeklyJourney> &
  mongoose.Document;
const schema = new mongoose.Schema<IWeeklyJourney>(
  {
    title: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    day: {
      type: mongoose.Schema.Types.Number,
      required: true,
    },
    week: {
      type: mongoose.Schema.Types.Number,
      required: true,
    },
    actions: {
      actionNum: {
        type: mongoose.Schema.Types.Number,
        required: true,
      },
      /*
       * 1-quiz,2-story,3-simulation and 4 - task
       */
      type: {
        type: mongoose.Schema.Types.Number,
        default: 0,
      },
      quizId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: "quiz",
      },
      taskName: {
        type: mongoose.Schema.Types.String,
        default: 0,
      },
      actionInput: {
        type: mongoose.Schema.Types.String,
        default: null,
      },
      reward: {
        type: mongoose.Schema.Types.Number,
        default: 0,
      },
    },
    /*
     * 1 - dripshopid and 2 - fuels
     */
    rewardType: {
      type: mongoose.Schema.Types.Boolean,
      required: true,
      default: false,
    },
    reward: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      default: false,
    },
  },
  { timestamps: true }
);
export const WeeklyJourneyTable = mongoose.model<IWeeklyJourney>(
  "weekly_journey",
  schema
);
