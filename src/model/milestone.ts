import mongoose from "mongoose";

import type { IMilestone, MongooseModel } from "@app/types";

export type IMilestoneSchema = MongooseModel<IMilestone> & mongoose.Document;

const schema = new mongoose.Schema<IMilestoneSchema>(
  {
    milestone: {
      type: mongoose.Schema.Types.String,
      required: true,
      default: null,
    },
    title: {
      type: mongoose.Schema.Types.String,
      required: true,
      default: null,
    },
    topicId: {
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
    time: {
      type: mongoose.Schema.Types.String,
      required: true,
      default: null,
    },
    goals: [
      {
        order: {
          type: mongoose.Schema.Types.Number,
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
      },
    ],
  },
  { timestamps: true }
);

export const MilestoneTable = mongoose.model<IMilestoneSchema>(
  "milestone",
  schema
);
