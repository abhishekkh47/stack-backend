import mongoose from "mongoose";

import type { IChecklistResult, MongooseModel } from "@app/types";

export type IChecklistResultSchema = MongooseModel<IChecklistResult> &
  mongoose.Document;
const schema = new mongoose.Schema<IChecklistResult>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "user",
    },
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "weekly_journey",
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "user",
    },
    level: {
      type: mongoose.Schema.Types.Number,
      required: true,
    },
    actionNum: {
      type: mongoose.Schema.Types.Number,
      required: true,
    },
  },
  { timestamps: true }
);
export const ChecklistResultTable = mongoose.model<IChecklistResult>(
  "checklist_result",
  schema
);
