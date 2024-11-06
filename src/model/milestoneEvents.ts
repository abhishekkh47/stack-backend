import mongoose from "mongoose";

import type { IMilestoneEvents, MongooseModel } from "@app/types";

export type IMilestoneEventsSchema = MongooseModel<IMilestoneEvents> &
  mongoose.Document;

const schema = new mongoose.Schema<IMilestoneEventsSchema>(
  {
    eventId: {
      type: mongoose.Schema.Types.Number,
      required: true,
      default: 0,
    },
    scenario: {
      type: mongoose.Schema.Types.String,
      required: true,
      default: null,
    },
    scenarioImage: {
      type: mongoose.Schema.Types.String,
      required: true,
      default: null,
    },
    options: [
      {
        choice: {
          type: mongoose.Schema.Types.String,
          required: true,
          default: null,
        },
        action: {
          type: mongoose.Schema.Types.String,
          required: true,
          default: null,
        },
        resultCopyInfo: [
          {
            image: {
              type: mongoose.Schema.Types.String,
              required: true,
              default: null,
            },
            description: {
              type: mongoose.Schema.Types.String,
              required: true,
              default: null,
            },
          },
        ],
        fans: {
          type: mongoose.Schema.Types.Number,
          required: true,
          default: 0,
        },
        cash: {
          type: mongoose.Schema.Types.Number,
          required: true,
          default: 0,
        },
        businessScore: {
          type: mongoose.Schema.Types.Number,
          required: true,
          default: 0,
        },
        tokens: {
          type: mongoose.Schema.Types.Number,
          required: true,
          default: 0,
        },
      },
    ],
  },
  { timestamps: true }
);

export const MilestoneEventsTable = mongoose.model<IMilestoneEventsSchema>(
  "milestone_event",
  schema
);
