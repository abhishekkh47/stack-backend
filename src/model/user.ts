import mongoose from "mongoose";

import type { IUser, MongooseModel } from "../types";

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
    /**
     * 1 - Kyc document upload , 2 - Kyc failed and reupload document , 3 - Kyc approved
     */
    status: { type: mongoose.Schema.Types.Number, default: 0 },
    /**
     * 0 - Sign up , 1 - change address , 2 - upload document field , 3 - acknowledge screen , 4 - add bank account
     */
    screenStatus: { type: mongoose.Schema.Types.Number, default: 0 },
    parentEmail: { type: mongoose.Schema.Types.String, default: null },
    parentMobile: { type: mongoose.Schema.Types.String, default: null },
    kycMessages: {
      type: mongoose.Schema.Types.Array,
      default: null,
    },
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
    city: { type: mongoose.Schema.Types.String, default: null },
    postalCode: { type: mongoose.Schema.Types.String, default: null },
    unitApt: { type: mongoose.Schema.Types.String, default: null },
    cipCleared: { type: mongoose.Schema.Types.Boolean, default: false },
    amlCleared: { type: mongoose.Schema.Types.Boolean, default: false },
    identityConfirmed: { type: mongoose.Schema.Types.Boolean, default: false },
    stateId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      ref: "state",
    },
    liquidAsset: { type: mongoose.Schema.Types.Number, default: null },
    taxIdNo: { type: mongoose.Schema.Types.String, default: null },
    taxState: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      ref: "state",
    },
    dob: { type: mongoose.Schema.Types.String, default: null },
    profilePicture: { type: mongoose.Schema.Types.String, default: null },
    /**
     * 0 - no and 1 - yes
     */
    isAcknowledged: { type: mongoose.Schema.Types.Number, default: null },
    /**
     * 0 coins by default and if top waitlist user, you will get 250 coins.
     */
    preLoadedCoins: { type: mongoose.Schema.Types.Number, default: 0 },
    /**
     * 0 - not gifted and 1 - gifted
     */
    isGifted: { type: mongoose.Schema.Types.Number, default: 0 },
    referralCode: { type: mongoose.Schema.Types.String, default: null },
    isParentFirst: { type: mongoose.Schema.Types.Boolean, default: false },
    /**
     * 1 - on and 2 - off
     */
    isAutoApproval: {
      type: mongoose.Schema.Types.Number,
      required: true,
      default: 1,
      isIn: [1, 2],
    },
    /*
     * accountStatus:- pending , opened and closed
     */
    accountStatus: { type: mongoose.Schema.Types.String, default: "pending" },
  },
  { timestamps: true }
);

export const UserTable = mongoose.model<IUserSchema>("users", schema);
