import mongoose from "mongoose";

import type { IUserProjects, MongooseModel } from "@app/types";

export type IUserProjectsSchema = MongooseModel<IUserProjects> &
  mongoose.Document;

const schema = new mongoose.Schema<IUserProjectsSchema>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "users",
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "employees",
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "employee_projects",
    },
    status: {
      type: mongoose.Schema.Types.Number,
      default: 0,
      required: true,
    },
    startedAt: {
      type: mongoose.Schema.Types.Date,
      default: null,
    },
    completedAt: {
      type: mongoose.Schema.Types.Date,
      default: null,
    },
    endAt: {
      type: mongoose.Schema.Types.Date,
      default: null,
    },
  },
  { timestamps: true }
);

export const UserProjectsTable = mongoose.model<IUserProjectsSchema>(
  "user_project",
  schema
);
