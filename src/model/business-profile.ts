import mongoose from "mongoose";

import type { IBusinessProfile, MongooseModel } from "@app/types";

export type IBusinessProfileSchema = MongooseModel<IBusinessProfile> &
  mongoose.Document;

const schema = new mongoose.Schema<IBusinessProfileSchema>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
      ref: "user",
    },
    impacts: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "impact",
    },
    passions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "passion",
      },
    ],
    description: {
      type: mongoose.Schema.Types.String,
      required: true,
      default: null,
    },
    businessLogo: {
      type: mongoose.Schema.Types.String,
      required: false,
      default: null,
    },
    businessName: {
      type: mongoose.Schema.Types.String,
      required: false,
      default: null,
    },
    competitors: {
      type: mongoose.Schema.Types.String,
      required: false,
      default: null,
    },
    keyDifferentiators: {
      type: mongoose.Schema.Types.String,
      required: false,
      default: null,
    },
    targetAudience: {
      type: mongoose.Schema.Types.String,
      required: false,
      default: null,
    },
    coreStrategy: {
      type: mongoose.Schema.Types.String,
      required: false,
      default: null,
    },
  },
  { timestamps: true }
);
export const BusinessProfileTable = mongoose.model<IBusinessProfileSchema>(
  "business-profile",
  schema
);
