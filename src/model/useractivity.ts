import mongoose from "mongoose";

import type { IUserActivity, MongooseModel } from "@app/types";

export type IUserActivitySchema = MongooseModel<IUserActivity> &
  mongoose.Document;

const schema = new mongoose.Schema<IUserActivitySchema>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    message: {
      type: mongoose.Schema.Types.String,
      default: null,
    },
    resourceId: {
      type: mongoose.Schema.Types.String,
      default: null,
    },
    /**
     * 1 - Teen and 2 - Parent
     */
    userType: {
      type: mongoose.Schema.Types.Number,
      required: true,
    },
    /**
     * 1 - Deposit , 2- Withdraw , 3 - Buy Crypto and 4 - Sell Crypto
     */
    action: {
      type: mongoose.Schema.Types.Number,
      required: true,
    },
    isMax: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
    /**
     * 1 - Pending , 2 - Processed , 3 - Rejected and 4 - Cancelled
     */
    status: {
      type: mongoose.Schema.Types.Number,
      required: true,
    },
    currencyValue: {
      type: mongoose.Schema.Types.Number,
      required: true,
    },
    currencyType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "crypto",
      default: null,
    },
    cryptoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "crypto",
      default: null,
    },
  },
  { timestamps: true }
);

export const UserActivityTable = mongoose.model<IUserActivitySchema>(
  "useractivity",
  schema
);
