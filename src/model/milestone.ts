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
  },
  { timestamps: true }
);

export const MilestoneTable = mongoose.model<IMilestoneSchema>(
  "milestone",
  schema
);
