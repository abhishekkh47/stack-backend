import mongoose from "mongoose";

import type { IEmployees, MongooseModel } from "@app/types";

export type IEmployeesSchema = MongooseModel<IEmployees> & mongoose.Document;

const schema = new mongoose.Schema<IEmployeesSchema>(
  {
    name: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    icon: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    title: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    image: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    price: {
      type: mongoose.Schema.Types.Number,
      required: true,
    },
    workTime: {
      type: mongoose.Schema.Types.Number,
      required: true,
    },
    bio: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    /**
     * 0 = ALL
     * 1 = PRO
     */
    userType: {
      type: mongoose.Schema.Types.Number,
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.Number,
      required: true,
    },
    ratings: [
      {
        type: mongoose.Schema.Types.String,
        required: true,
      },
    ],
    available: {
      type: mongoose.Schema.Types.Boolean,
      default: true,
      required: true,
    },
  },
  { timestamps: true }
);

export const EmployeeTable = mongoose.model<IEmployeesSchema>(
  "employee",
  schema
);
