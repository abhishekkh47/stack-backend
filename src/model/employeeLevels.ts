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
      required: true,
    },
    title: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    ratingValues: [
      {
        name: {
          type: mongoose.Schema.Types.String,
          required: true,
        },
        value: {
          type: mongoose.Schema.Types.String,
          required: true,
        },
      },
    ],
    promotionTrigger: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    promotionCost: {
      type: mongoose.Schema.Types.Number,
      required: true,
    },
  },
  { timestamps: true }
);

export const EmployeeLevelsTable = mongoose.model<IEmployeeLevelsSchema>(
  "employee_level",
  schema
);
