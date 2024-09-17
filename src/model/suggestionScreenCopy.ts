import mongoose from "mongoose";

import type { ISuggestionScreenCopy, MongooseModel } from "@app/types";

export type ISuggestionScreenCopySchema = MongooseModel<ISuggestionScreenCopy> &
  mongoose.Document;

const schema = new mongoose.Schema<ISuggestionScreenCopy>(
  {
    key: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    name: {
      type: mongoose.Schema.Types.String,
      required: true,
      default: null,
    },
    title: {
      type: mongoose.Schema.Types.String,
      default: null,
    },
    actionName: {
      type: mongoose.Schema.Types.String,
      required: true,
      default: null,
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
    actionType: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    isGrid: {
      type: mongoose.Schema.Types.Boolean,
      required: true,
    },
    section: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    stepList: [
      {
        stepName: {
          type: mongoose.Schema.Types.String,
          default: null,
        },
        stepStatus: {
          type: mongoose.Schema.Types.Number,
          default: null,
        },
        value: {
          type: mongoose.Schema.Types.Number,
          default: null,
        },
      },
    ],
    saveButtonText: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);
export const SuggestionScreenCopyTable = mongoose.model<ISuggestionScreenCopy>(
  "suggestions_screen_copy",
  schema
);
