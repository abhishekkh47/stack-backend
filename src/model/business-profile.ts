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
    },
    businessLogo: {
      type: mongoose.Schema.Types.String,
    },
    businessName: {
      type: mongoose.Schema.Types.String,
    },
    competitors: {
      type: mongoose.Schema.Types.String,
    },
    keyDifferentiators: {
      type: mongoose.Schema.Types.String,
    },
    targetAudience: {
      type: mongoose.Schema.Types.String,
    },
    coreStrategy: {
      type: mongoose.Schema.Types.String,
    },
  },
  { timestamps: true }
);
export const BusinessProfileTable = mongoose.model<IBusinessProfileSchema>(
  "business-profile",
  schema
);
