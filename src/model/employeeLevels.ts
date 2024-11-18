import mongoose from "mongoose";

import type { IEmployeeLevels, MongooseModel } from "@app/types";

export type IEmployeeLevelsSchema = MongooseModel<IEmployeeLevels> &
  mongoose.Document;

const schema = new mongoose.Schema<IEmployeeLevelsSchema>(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
      ref: "employees",
    },
    level: {
      type: mongoose.Schema.Types.Number,
      default: 0,
      required: true,
    },
    title: {
      type: mongoose.Schema.Types.String,
      default: null,
      required: true,
    },
    ratingValues: [
      {
        name: {
          type: mongoose.Schema.Types.String,
          default: null,
          required: true,
        },
        value: {
          type: mongoose.Schema.Types.Number,
          default: 0,
          required: true,
        },
      },
    ],
    promotionCost: {
      type: mongoose.Schema.Types.Number,
      default: 0,
      required: true,
    },
    unlockTrigger: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    unlockTriggerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "milestone_events",
    },
    /**
     * Type 1 = unlock on event completion
     * Type 2 = unlock on stage completion
     */
    unlockTriggerType: {
      type: mongoose.Schema.Types.Number,
      required: true,
      default: 2,
    },
  },
  { timestamps: true }
);

export const EmployeeLevelsTable = mongoose.model<IEmployeeLevelsSchema>(
  "employee_level",
  schema
);
