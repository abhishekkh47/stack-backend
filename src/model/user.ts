import mongoose from "mongoose";

import {
  ERECURRING,
  ENOTIFICATIONSETTINGS,
  IUser,
  MongooseModel,
  EPHONEVERIFIEDSTATUS,
} from "../types";

export type IUserSchema = MongooseModel<IUser> & mongoose.Document;

const schema = new mongoose.Schema<IUserSchema>(
  {
    email: {
      type: mongoose.Schema.Types.String,
      required: false,
      default: null,
    },
    password: { // TODO: let's remove for now in v1.7
      type: mongoose.Schema.Types.String,
      required: false,
      default: null,
    },
    username: { // TODO: let's remove for now in v1.7
      type: mongoose.Schema.Types.String,
      required: false,
      default: null,
    },
    mobile: { type: mongoose.Schema.Types.String, required: false },
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
     * 1 - teenager,  2 - parent and 3 - Self
     */
    type: {
      type: mongoose.Schema.Types.Number,
      required: false,
      default: null,
    },
    /**
     * 1 - Kyc document upload , 2 - Kyc failed and reupload document , 3 - Kyc approved
     */
    status: { type: mongoose.Schema.Types.Number, default: 0 },
    /**
     * false if the account does not have any settled deposits, true otherwise
     */
    funded: { type: mongoose.Schema.Types.Boolean, default: false },
    /**
     * 0 - Sign up , 1 - change address , 2 - upload document field , 3 - acknowledge screen , 4 - add bank account
     */
    screenStatus: { type: mongoose.Schema.Types.Number, default: 0 }, // TODO: let's remove this in v1.7
    parentEmail: { type: mongoose.Schema.Types.String, default: null },
    parentMobile: { type: mongoose.Schema.Types.String, default: null },
    kycMessages: {
      type: mongoose.Schema.Types.Array,
      default: null,
    },
    verificationEmailExpireAt: { // TODO: let's remove this in v1.7
      type: mongoose.Schema.Types.String,
      description: "verification email expiry time",
      example: 1502844074211,
    },
    verificationCode: { // TODO: let's remove this in v1.7
      type: mongoose.Schema.Types.String,
      description: "Email verification code",
      default: null,
      required: false,
    },
    tempPassword: { type: mongoose.Schema.Types.String, default: null }, // TODO: let's remove this in v1.7
    loginAttempts: { type: mongoose.Schema.Types.Number, default: 0 }, // TODO: let's remove this in v1.7
    refreshToken: { type: mongoose.Schema.Types.String, default: null }, // TODO: do we need this? yes but...
    country: { type: mongoose.Schema.Types.String, default: null },
    state: { type: mongoose.Schema.Types.String, default: null },
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
    liquidAsset: { type: mongoose.Schema.Types.Number, default: null }, // TODO: let's remove this in v1.7
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
     * Rewarded coin value, i.e;
     * Coins that we reward to signed up users or other users can gift
     * you will get 1000 coins by signing up.
     */
    preLoadedCoins: { type: mongoose.Schema.Types.Number, default: 0 },
    /**
     * number of quiz coins used by teen
     */
    quizCoins: {
      type: mongoose.Schema.Types.Number,
      default: 0,
    },
    /**
     * 0 - not gifted and 1 - gifted
     */
    isGifted: { type: mongoose.Schema.Types.Number, default: 0 },
    isPhoneVerified: {
      type: mongoose.Schema.Types.Number,
      default: 0,
      isIn: [EPHONEVERIFIEDSTATUS.FALSE, EPHONEVERIFIEDSTATUS.TRUE],
    },
    /**
     * 0 - not gifted(won't happen at all) , 1 - gifted and 2 - gifted with pt
     * isGiftedCrypto = 1, which means $5 is stored in DB, not in PT
     * isGiftedCrypto = 2, it will be in DB and PT
     */
    isGiftedCrypto: { type: mongoose.Schema.Types.Number, default: 0 },
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
    /**
     * 0 - no bank , 1 - no recurring , 2 - daily , 3 - weekly and 4 - monthly
     */
    isRecurring: {
      type: mongoose.Schema.Types.Number,
      isIn: [
        ERECURRING.NO_BANK,
        ERECURRING.NO_RECURRING,
        ERECURRING.WEEKLY,
        ERECURRING.MONTLY,
        ERECURRING.DAILY,
      ],
      default: 0,
    },
    /**
     * 0-off, 1-on
     */
    isNotificationOn: {
      type: mongoose.Schema.Types.Number,
      default: 1,
      isIn: [ENOTIFICATIONSETTINGS.ON, ENOTIFICATIONSETTINGS.OFF],
    },
    /**
     * If isRecurring done then selectedDeposit else 0
     */
    selectedDeposit: {
      type: mongoose.Schema.Types.Number,
      default: 0,
    },
    /**
     * If isRecurring done then selectedDepositDate else null
     */
    selectedDepositDate: {
      type: mongoose.Schema.Types.Date,
      default: null,
    },
  },
  { timestamps: true }
);

export const UserTable = mongoose.model<IUserSchema>("users", schema);
