import mongoose from "mongoose";

import type { IDailyChallenge, MongooseModel } from "@app/types";

export type IDailyChallengeSchema = MongooseModel<IDailyChallenge> &
  mongoose.Document;
const schema = new mongoose.Schema<IDailyChallenge>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "user",
    },
    dailyGoalStatus: [
      {
        id: {
          type: mongoose.Schema.Types.String,
          required: true,
          default: null,
        },
        _id: {
          type: mongoose.Schema.Types.String,
          required: true,
          default: null,
        },
        day: {
          type: mongoose.Schema.Types.Number,
          required: true,
          default: 0,
        },
        milestoneId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          default: null,
        },
        title: {
          type: mongoose.Schema.Types.String,
          required: true,
          default: null,
        },
        dependency: [
          {
            type: mongoose.Schema.Types.String,
            required: true,
            default: null,
          },
        ],
        iconBackgroundColor: {
          type: mongoose.Schema.Types.String,
          required: true,
          default: null,
        },
        key: {
          type: mongoose.Schema.Types.String,
          required: true,
          default: null,
        },
        order: {
          type: mongoose.Schema.Types.Number,
          required: true,
          default: 0,
        },
        template: {
          type: mongoose.Schema.Types.Number,
          required: true,
          default: 1,
        },
        time: {
          type: mongoose.Schema.Types.String,
          required: true,
          default: null,
        },
        iconImage: {
          type: mongoose.Schema.Types.String,
          required: true,
          default: null,
        },
        isLocked: {
          type: mongoose.Schema.Types.Boolean,
          default: false,
        },
        isCompleted: {
          type: mongoose.Schema.Types.Boolean,
          default: false,
        },
        categoryId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "quiz_categories",
          default: null,
        },
        inputTemplate: {
          optionsScreenInfo: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
          },
          questionScreenInfo: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
          },
          suggestionScreenInfo: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
          },
        },
      },
    ],
  },
  { timestamps: true }
);
export const DailyChallengeTable = mongoose.model<IDailyChallenge>(
  "daily_challenge",
  schema
);
