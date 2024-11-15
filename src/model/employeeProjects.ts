import mongoose from "mongoose";

import type { IEmployeeProjects, MongooseModel } from "@app/types";

export type IEmployeeProjectsSchema = MongooseModel<IEmployeeProjects> &
  mongoose.Document;

const schema = new mongoose.Schema<IEmployeeProjectsSchema>(
  {
    employeeLevelId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "employee_levels",
    },
    title: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    description: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.Number,
      required: true,
    },
    rewards: [
      {
        probability: {
          type: mongoose.Schema.Types.String,
          default: null,
          required: true,
        },
        image: {
          type: mongoose.Schema.Types.String,
          default: null,
          required: true,
        },
        description: {
          type: mongoose.Schema.Types.String,
          default: null,
          required: true,
        },
        rating: {
          type: mongoose.Schema.Types.Number,
          default: 0,
          required: true,
        },
        cash: {
          type: mongoose.Schema.Types.Number,
          default: 0,
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

export const EmployeeProjectsTable = mongoose.model<IEmployeeProjectsSchema>(
  "employee_project",
  schema
);
