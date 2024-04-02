import mongoose from "mongoose";

import type { ICoachProfile, MongooseModel } from "@app/types";

export type ICoachProfileSchema = MongooseModel<ICoachProfile> &
  mongoose.Document;

const schema = new mongoose.Schema<ICoachProfileSchema>(
  {
    key: {
      type: mongoose.Schema.Types.String,
      required: true,
      default: null,
    },
    name: {
      type: mongoose.Schema.Types.String,
      required: true,
      default: null,
    },
    position: {
      type: mongoose.Schema.Types.String,
      required: true,
      default: null,
    },
    image: {
      type: mongoose.Schema.Types.String,
      required: true,
      default: null,
    },
    linkedIn: {
      type: mongoose.Schema.Types.String,
      required: true,
      default: null,
    },
    rating: {
      type: mongoose.Schema.Types.Number,
      required: true,
      default: null,
    },
    reviews: {
      type: mongoose.Schema.Types.Number,
      required: true,
      default: 0,
    },
    mobile: {
      type: mongoose.Schema.Types.String,
      required: true,
      default: null,
    },
    about: {
      type: mongoose.Schema.Types.String,
      required: true,
      default: null,
    },
    skills: [
      {
        type: mongoose.Schema.Types.String,
        default: null,
      },
    ],
    whyItsValuable: [
      {
        name: {
          type: mongoose.Schema.Types.String,
          required: true,
          default: null,
        },
        description: {
          type: mongoose.Schema.Types.String,
          required: true,
          default: null,
        },
        date: {
          type: mongoose.Schema.Types.String,
          required: true,
          default: null,
        },
      },
    ],
  },
  { timestamps: true }
);

export const CoachProfileTable = mongoose.model<ICoachProfileSchema>(
  "coach_profile",
  schema
);
