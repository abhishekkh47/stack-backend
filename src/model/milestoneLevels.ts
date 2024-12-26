import mongoose from "mongoose";

import { IMilestoneLevels, MongooseModel } from "@app/types";

export type IMilestoneLevelsSchema = MongooseModel<IMilestoneLevels> &
  mongoose.Document;

const schema = new mongoose.Schema<IMilestoneLevelsSchema>(
  {
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
    dayTitle: {
      type: mongoose.Schema.Types.String,
      required: true,
      default: null,
    },
    level: {
      type: mongoose.Schema.Types.Number,
      required: true,
      default: 0,
    },
    levelImage: {
      type: mongoose.Schema.Types.String,
      required: true,
      default: null,
    },
    time: {
      type: mongoose.Schema.Types.String,
      required: true,
      default: null,
    },
    roadmapIcon: {
      type: mongoose.Schema.Types.String,
      required: true,
      default: null,
    },
  },
  { timestamps: true }
);

export const MilestoneLevelsTable = mongoose.model<IMilestoneLevelsSchema>(
  "milestone_levels",
  schema
);
