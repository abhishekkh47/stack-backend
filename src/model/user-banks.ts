import mongoose from "mongoose";

import {EBankStatus, IBankAccount, MongooseModel } from "../types";

export type IUserBanksSchema = MongooseModel<IBankAccount> &
  mongoose.Document;

const schema = new mongoose.Schema<IUserBanksSchema>(
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
    relationshipId: {
      type: mongoose.Schema.Types.String,
      default: null,
    },
    /**
     * 1 - pending , 2 - approved and 0 - queued
     */
    status: {
      type: mongoose.Schema.Types.Number,
      isIn: [
        EBankStatus.PENDING,
        EBankStatus.QUEUED,
        EBankStatus.APPROVED,
      ],
      default: 0,
    },
    processorToken: {
      type: mongoose.Schema.Types.String,
      default: null,
    },
    insId: {
      type: mongoose.Schema.Types.String,
      default: null,
    },
    accessToken: {
      type: mongoose.Schema.Types.String,
      default: null,
    },
    /**
     * 0 - not default, 1- default bank
     */
    isDefault: {
      type: mongoose.Schema.Types.Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export const UserBanksTable = mongoose.model<IUserBanksSchema>(
  "userbanks",
  schema,
  "userbanks"
);
