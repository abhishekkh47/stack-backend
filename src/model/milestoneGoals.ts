import mongoose from "mongoose";

import type { IMilestoneGoals, MongooseModel } from "@app/types";

export type IMilestoneGoalsSchema = MongooseModel<IMilestoneGoals> &
  mongoose.Document;

const schema = new mongoose.Schema<IMilestoneGoalsSchema>(
  {
    milestoneId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "milestones",
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
    icon: {
      type: mongoose.Schema.Types.String,
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
    time: {
      type: mongoose.Schema.Types.String,
      required: true,
      default: null,
    },
    template: {
      type: mongoose.Schema.Types.String,
      required: true,
      default: null,
    },
    dependency: [
      {
        type: mongoose.Schema.Types.String,
        required: true,
        default: null,
      },
    ],
  },
  { timestamps: true }
);

export const MilestoneGoalsTable = mongoose.model<IMilestoneGoalsSchema>(
  "milestone_goals",
  schema
);
