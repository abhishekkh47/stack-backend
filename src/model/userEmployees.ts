import mongoose from "mongoose";

import type { IUserEmployees, MongooseModel } from "@app/types";

export type IUserEmployeesSchema = MongooseModel<IUserEmployees> &
  mongoose.Document;

const schema = new mongoose.Schema<IUserEmployeesSchema>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "employees",
      required: true,
    },
    currentLevel: {
      type: mongoose.Schema.Types.Number,
      default: 1,
      required: true,
    },
    unlockedLevel: {
      type: mongoose.Schema.Types.Number,
      default: 1,
      required: true,
    },
    currentRatings: [
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
    hiredAt: {
      type: mongoose.Schema.Types.Date,
      default: null,
      required: true,
    },
    status: {
      type: mongoose.Schema.Types.Number,
      default: 0,
      required: true,
    },
  },
  { timestamps: true }
);

export const UserEmployeesTable = mongoose.model<IUserEmployeesSchema>(
  "user_employee",
  schema
);
