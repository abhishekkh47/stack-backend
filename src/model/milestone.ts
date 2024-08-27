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
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      default: null,
    },
    description: {
      type: mongoose.Schema.Types.String,
      required: true,
      default: null,
    },
    order: {
      type: mongoose.Schema.Types.Number,
      required: true,
      default: 0,
    },
    locked: {
      type: mongoose.Schema.Types.Boolean,
      required: true,
      default: false,
    },
  },
  { timestamps: true }
);

export const MilestoneTable = mongoose.model<IMilestoneSchema>(
  "milestone",
  schema
);
