import mongoose from "mongoose";

import type { IAIToolsUsageStatus, MongooseModel } from "@app/types";

export type IAIToolsUsageStatusSchema = MongooseModel<IAIToolsUsageStatus> &
  mongoose.Document;

const schema = new mongoose.Schema<IAIToolsUsageStatusSchema>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
      ref: "user",
    },
    description: {
      type: mongoose.Schema.Types.Boolean,
      required: true,
      default: false,
    },
    ideaValidation: {
      type: mongoose.Schema.Types.Boolean,
      required: true,
      default: false,
    },
    companyName: {
      type: mongoose.Schema.Types.Boolean,
      required: true,
      default: false,
    },
    companyLogo: {
      type: mongoose.Schema.Types.Boolean,
      required: true,
      default: false,
    },
    targetAudience: {
      type: mongoose.Schema.Types.Boolean,
      required: true,
      default: false,
    },
    competitors: {
      type: mongoose.Schema.Types.Boolean,
      required: true,
      default: false,
    },
    colorsAndAesthetic: {
      type: mongoose.Schema.Types.Boolean,
      required: true,
      default: false,
    },
    descriptionRetry: {
      type: mongoose.Schema.Types.Boolean,
      required: true,
      default: false,
    },
    ideaValidationRetry: {
      type: mongoose.Schema.Types.Boolean,
      required: true,
      default: false,
    },
    companyNameRetry: {
      type: mongoose.Schema.Types.Boolean,
      required: true,
      default: false,
    },
    companyLogoRetry: {
      type: mongoose.Schema.Types.Boolean,
      required: true,
      default: false,
    },
    targetAudienceRetry: {
      type: mongoose.Schema.Types.Boolean,
      required: true,
      default: false,
    },
    competitorsRetry: {
      type: mongoose.Schema.Types.Boolean,
      required: true,
      default: false,
    },
    colorsAndAestheticRetry: {
      type: mongoose.Schema.Types.Boolean,
      required: true,
      default: false,
    },
  },
  { timestamps: true }
);
export const AIToolsUsageStatusTable =
  mongoose.model<IAIToolsUsageStatusSchema>("ai_tools_usage_status", schema);
