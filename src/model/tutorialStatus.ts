import mongoose from "mongoose";

import type { ITutorialStatus, MongooseModel } from "@app/types";

export type ITutorialStatusSchema = MongooseModel<ITutorialStatus> &
  mongoose.Document;
const schema = new mongoose.Schema<ITutorialStatus>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "user",
    },
    quiz: {
      type: mongoose.Schema.Types.Boolean,
      required: true,
      default: false,
    },
    caseStudy: {
      type: mongoose.Schema.Types.Boolean,
      required: true,
      default: false,
    },
    simulation: {
      type: mongoose.Schema.Types.Boolean,
      required: true,
      default: false,
    },
    aiTools: {
      type: mongoose.Schema.Types.Boolean,
      required: true,
      default: false,
    },
    ideaGenerator: {
      type: mongoose.Schema.Types.Boolean,
      required: true,
      default: false,
    },
    mentorship: {
      type: mongoose.Schema.Types.Boolean,
      required: true,
      default: false,
    },
    aiToolVisited: {
      type: mongoose.Schema.Types.Boolean,
      required: true,
      default: false,
    },
    mentorshipVisited: {
      type: mongoose.Schema.Types.Boolean,
      required: true,
      default: false,
    },
  },
  { timestamps: true }
);
export const TutorialStatusTable = mongoose.model<ITutorialStatus>(
  "tutorial_status",
  schema
);
