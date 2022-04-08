import mongoose from "mongoose";

import type { IUser, MongooseModel } from "@app/types";

export type IUserSchema = MongooseModel<IUser> & mongoose.Document;

const schema = new mongoose.Schema<IUserSchema>(
  {
    email: {
      type: mongoose.Schema.Types.String,
      required: false,
      default: null,
    },
    password: {
      type: mongoose.Schema.Types.String,
      required: false,
      default: null,
    },
    username: {
      type: mongoose.Schema.Types.String,
      required: false,
      default: null,
    },
    mobile: { type: mongoose.Schema.Types.String, required: true },
    address: { type: mongoose.Schema.Types.String, default: null },
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
    /**
     * 1 - teenager and 2 - parent
     */
    type: { type: mongoose.Schema.Types.Number, required: true },
    parentEmail: { type: mongoose.Schema.Types.String, default: null },
    parentMobile: { type: mongoose.Schema.Types.String, default: null },
    verificationEmailExpireAt: {
      type: mongoose.Schema.Types.String,
      description: "verification email expiry time",
      example: 1502844074211,
    },
    verificationCode: {
      type: mongoose.Schema.Types.String,
      description: "Email verification code",
      default: null,
      required: false,
    },
    tempPassword: { type: mongoose.Schema.Types.String, default: null },
    loginAttempts: { type: mongoose.Schema.Types.Number, default: 0 },
    refreshToken: { type: mongoose.Schema.Types.String, default: null },
    country: { type: mongoose.Schema.Types.String, default: null },
    state: { type: mongoose.Schema.Types.String, default: null },
    city: { type: mongoose.Schema.Types.String, default: null },
    postalCode: { type: mongoose.Schema.Types.String, default: null },
    unitApt: { type: mongoose.Schema.Types.String, default: null },
    liquidAsset: { type: mongoose.Schema.Types.Number, default: null },
    taxIdNo: { type: mongoose.Schema.Types.String, default: null },
    taxState: { type: mongoose.Schema.Types.String, default: null },
  },
  { timestamps: true }
);

export const UserTable = mongoose.model<IUserSchema>("users", schema);
