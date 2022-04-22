import mongoose from "mongoose";

import type { IUserBalance, MongooseModel } from "../types";

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

export const UserWalletTable = mongoose.model<IUserBalanceSchema>(
  "userbalance",
  schema,
  "userwallet"
);
