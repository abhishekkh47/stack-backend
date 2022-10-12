import mongoose from "mongoose";

import type { IUserdraft, MongooseModel } from "../types";

export type IChilddraftSchema = MongooseModel<IUserdraft> & mongoose.Document;

const schema = new mongoose.Schema<IUserdraft>(
  {
    email: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    dob: { type: mongoose.Schema.Types.String, default: null },
    phoneNumber: {
      type: mongoose.Schema.Types.String,
      required: false,
      default: null,
    },
    parentNumber: {
      type: mongoose.Schema.Types.String,
      required: false,
      default: null,
    },
    screenStatus: { type: mongoose.Schema.Types.Number, default: 0 },
    firstName: {
      type: mongoose.Schema.Types.String,
      required: false,
      default: null,
    },
    lastName: {
      type: mongoose.Schema.Types.String,
      required: false,
      default: null,
    },
    type: {
      type: mongoose.Schema.Types.Number,
      required: false,
      default: null,
    },
    refreshToken: { type: mongoose.Schema.Types.String, default: null },
  },
  { timestamps: true }
);

export const UserDraftTable = mongoose.model<IUserdraft>(
  "userdraft",
  schema,
  "userdraft"
);
