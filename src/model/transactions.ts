import mongoose from "mongoose";

import type { ITransaction, MongooseModel } from "../types";

export type ITransactionSchema = MongooseModel<ITransaction> &
  mongoose.Document;

const schema = new mongoose.Schema<ITransactionSchema>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      default: null,
    },
    cryptoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "crypto",
      required: true,
    },
    assetId: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    settledTime: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    /**
     * 1 - buy and 2 - sell
     */
    type: {
      type: mongoose.Schema.Types.Number,
      default: 0,
    },
    amount: {
      type: mongoose.Schema.Types.Number,
      required: true,
    },
    unitCount: {
      type: mongoose.Schema.Types.Number,
      required: true,
    },
  },
  { timestamps: true }
);

export const TransactionTable = mongoose.model<ITransactionSchema>(
  "transaction",
  schema
);
