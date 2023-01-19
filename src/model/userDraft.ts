import mongoose from "mongoose";

import { EPHONEVERIFIEDSTATUS } from "../types/user";
import type { IUserdraft, MongooseModel } from "../types";

export type IChilddraftSchema = MongooseModel<IUserdraft> & mongoose.Document;

const schema = new mongoose.Schema<IUserdraft>(
  {
    email: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    dob: { type: mongoose.Schema.Types.String, default: null },
    phoneNumber: { // TODO: let's remove this in v1.7
      type: mongoose.Schema.Types.String,
      required: false,
      default: null,
    },
    parentNumber: { // TODO: let's remove this in v1.7
      type: mongoose.Schema.Types.String,
      required: false,
      default: null,
    },
    screenStatus: { type: mongoose.Schema.Types.Number, default: 0 }, // TODO: let's remove this in v1.7
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
    referralCode: { // TODO: let's remove this in v1.7
      type: mongoose.Schema.Types.String,
      required: false,
      default: null,
    },
    mobile: {
      type: mongoose.Schema.Types.String,
      required: false,
      default: null,
    },
    isPhoneVerified: {
      type: mongoose.Schema.Types.Number,
      default: 0,
      isIn: [EPHONEVERIFIEDSTATUS.FALSE, EPHONEVERIFIEDSTATUS.TRUE],
    },
    refreshToken: { type: mongoose.Schema.Types.String, default: null },  // TODO: let's remove this in v1.7
  },
  { timestamps: true }
);

export const UserDraftTable = mongoose.model<IUserdraft>(
  "userdraft",
  schema,
  "userdraft"
);
