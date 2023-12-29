import mongoose from "mongoose";

import type { IAdmin, MongooseModel } from "@app/types";

export type IAdminSchema = MongooseModel<any> & mongoose.Document;

const schema = new mongoose.Schema<IAdminSchema>(
  {
    email: {
      type: mongoose.Schema.Types.String,
      required: false,
      default: null,
    },
    jwtToken: { type: mongoose.Schema.Types.String, default: null },
    zohoRefreshToken: { type: mongoose.Schema.Types.String, default: null },
    zohoAccessToken: { type: mongoose.Schema.Types.String, default: null },
    zohoExpiryTime: { type: mongoose.Schema.Types.Number, default: null },
    stackCoins: { type: mongoose.Schema.Types.Number, default: null },
    /**
     * 1 - ON AND 0 -OFF
     */
    giftStackCoinsSetting: {
      type: mongoose.Schema.Types.Number,
      isIn: [0, 1],
      default: 0,
    },
    giftCryptoAmount: { type: mongoose.Schema.Types.Number, default: null },
    /**
     * 1 - ON AND 0 -OFF
     */
    giftCryptoSetting: {
      type: mongoose.Schema.Types.Number,
      isIn: [0, 1],
      default: 0,
    },
    rewardHours: {
      type: mongoose.Schema.Types.Number,
      required: true,
    },
    quizImageAspectRatio: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    quizCooldown: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    token: {
      type: mongoose.Schema.Types.String,
      default: null,
    },
  },
  { timestamps: true }
);

export const AdminTable = mongoose.model<IAdminSchema>(
  "admin",
  schema,
  "admin"
);
