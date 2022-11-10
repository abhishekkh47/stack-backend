import mongoose from "mongoose";

import { EBkStatus, IBkAccount, MongooseModel } from "../types";

export type IUserBanks1Schema = MongooseModel<IBkAccount> & mongoose.Document;

const schema = new mongoose.Schema<IUserBanks1Schema>(
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
      isIn: [EBkStatus.PENDING, EBkStatus.QUEUED, EBkStatus.APPROVED],
      default: 1,
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

export const UserBanks1Table = mongoose.model<IUserBanks1Schema>(
  "userbanks1",
  schema,
  "userbanks1"
);
