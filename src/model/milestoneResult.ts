import mongoose from "mongoose";

import type { IMilestoneResult, MongooseModel } from "@app/types";

export type IMilestoneResultSchema = MongooseModel<IMilestoneResult> &
  mongoose.Document;

const schema = new mongoose.Schema<IMilestoneResultSchema>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      default: null,
    },
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "quiztopics",
      required: true,
      default: null,
    },
    milestoneId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "milestones",
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
    goalId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      default: null,
    },
    identifier: {
      type: mongoose.Schema.Types.String,
      required: true,
      default: null,
    },
  },
  { timestamps: true }
);

export const MilestoneResultTable = mongoose.model<IMilestoneResultSchema>(
  "milestone_result",
  schema
);
