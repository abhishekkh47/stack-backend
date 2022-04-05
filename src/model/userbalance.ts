import mongoose from "mongoose";

import type { IUserBalance, MongooseModel } from "@app/types";

export type IUserBalanceSchema = MongooseModel<IUserBalance> &
  mongoose.Document;

const schema = new mongoose.Schema<IUserBalanceSchema>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    balance: {
      type: mongoose.Schema.Types.Number,
      required: true,
    },
  },
  { timestamps: true }
);

export const UserBalanceTable = mongoose.model<IUserBalanceSchema>(
  "userbalance",
  schema,
  "userbalance"
);
