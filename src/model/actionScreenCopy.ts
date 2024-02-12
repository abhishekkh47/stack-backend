import mongoose from "mongoose";

import type { IActionScreenCopy, MongooseModel } from "@app/types";

export type IActionScreenCopySchema = MongooseModel<IActionScreenCopy> &
  mongoose.Document;

const schema = new mongoose.Schema<IActionScreenCopy>(
  {
    key: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    title: {
      type: mongoose.Schema.Types.String,
      default: null,
    },
    steps: [
      {
        type: mongoose.Schema.Types.String,
        default: null,
      },
    ],
    actionName: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    hoursSaved: {
      type: mongoose.Schema.Types.Number,
      required: true,
    },
    week: {
      type: mongoose.Schema.Types.Number,
      default: 0,
    },
    day: {
      type: mongoose.Schema.Types.Number,
      default: 0,
    },
    description: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    placeHolderText: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    maxCharLimit: {
      type: mongoose.Schema.Types.Number,
      required: true,
    },
    isMultiLine: {
      type: mongoose.Schema.Types.Boolean,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);
export const ActionScreenCopyTable = mongoose.model<IActionScreenCopy>(
  "action_screen_copy",
  schema
);
