import mongoose from "mongoose";

import { IMilestoneGoals, EInputTemplate, MongooseModel } from "@app/types";

export type IMilestoneGoalsSchema = MongooseModel<IMilestoneGoals> &
  mongoose.Document;

const schema = new mongoose.Schema<IMilestoneGoalsSchema>(
  {
    milestoneId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "milestones",
      required: true,
      default: null,
    },
    title: {
      type: mongoose.Schema.Types.String,
      required: true,
      default: null,
    },
    key: {
      type: mongoose.Schema.Types.String,
      required: true,
      default: null,
    },
    iconImage: {
      type: mongoose.Schema.Types.String,
      required: true,
      default: null,
    },
    iconBackgroundColor: {
      type: mongoose.Schema.Types.String,
      required: true,
      default: null,
    },
    day: {
      type: mongoose.Schema.Types.Number,
      required: true,
      default: 0,
    },
    order: {
      type: mongoose.Schema.Types.Number,
      required: true,
      default: 0,
    },
    time: {
      type: mongoose.Schema.Types.String,
      required: true,
      default: null,
    },
    template: {
      type: mongoose.Schema.Types.Number,
      required: true,
      isIn: [
        EInputTemplate.CHECKBOX,
        EInputTemplate.SINGLE_CHOICE,
        EInputTemplate.FREETEXT,
      ],
      default: 1,
    },
    dependency: [
      {
        type: mongoose.Schema.Types.String,
        required: true,
        default: null,
      },
    ],
    inputTemplate: {
      title: {
        type: mongoose.Schema.Types.String,
        required: true,
        default: null,
      },
      options: [
        {
          title: {
            type: mongoose.Schema.Types.String,
            required: true,
            default: null,
          },
          description: {
            type: mongoose.Schema.Types.String,
            required: true,
            default: null,
          },
          type: {
            type: mongoose.Schema.Types.Number,
            required: true,
            default: null,
          },
          image: {
            type: mongoose.Schema.Types.String,
            required: true,
            default: null,
          },
        },
      ],
    },
  },
  { timestamps: true }
);

export const MilestoneGoalsTable = mongoose.model<IMilestoneGoalsSchema>(
  "milestone_goals",
  schema
);
