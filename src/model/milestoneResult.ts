import mongoose from "mongoose";

import type { IMilestoneResult, MongooseModel } from "@app/types";

export type IMilestoneResultSchema = MongooseModel<IMilestoneResult> &
  mongoose.Document;

const schema = new mongoose.Schema<IMilestoneResultSchema>(
  {
    milestoneId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      default: null,
    },
    day: {
      type: mongoose.Schema.Types.Number,
      required: true,
      default: 0,
    },
    order: {
      type: mongoose.Schema.Types.Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true }
);

export const MilestoneResultTable = mongoose.model<IMilestoneResultSchema>(
  "milestone_result",
  schema
);
