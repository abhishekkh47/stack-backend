import mongoose from "mongoose";

import { ETransactionStatus, ITransaction, MongooseModel } from "../types";

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
      default: null,
    },
    /**
     * 1 - pending , 2 - settled and 3 - gifted
     */
    status: {
      type: mongoose.Schema.Types.Number,
      isIn: [
        ETransactionStatus.PENDING,
        ETransactionStatus.SETTLED,
        ETransactionStatus.GIFTED,
      ],
      default: 1,
    },
    intialDeposit: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
    /**
     * for buy and sell - it would be quote id and for deposit and withdraw it would be fund transfer id
     */
    executedQuoteId: {
      type: mongoose.Schema.Types.String,
      default: null,
    },
    assetId: {
      type: mongoose.Schema.Types.String,
      default: null,
    },
    settledTime: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    /**
     * 1 - buy , 2 - sell , 3 - deposit and 4 - withdraw
     */
    type: {
      type: mongoose.Schema.Types.Number,
      default: 0,
    },
    amount: {
      type: mongoose.Schema.Types.Number,
      required: true,
    },
    /**
     * for every buy - and for every sell +
     */
    amountMod: {
      type: mongoose.Schema.Types.Number,
      default: null,
    },
    unitCount: {
      type: mongoose.Schema.Types.Number,
      default: null,
    },
  },
  { timestamps: true }
);

export const TransactionTable = mongoose.model<ITransactionSchema>(
  "transaction",
  schema
);
