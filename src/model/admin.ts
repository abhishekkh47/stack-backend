import mongoose from "mongoose";

import type { IAdmin, MongooseModel } from "../types";

export type IAdminSchema = MongooseModel<IAdmin> & mongoose.Document;

const schema = new mongoose.Schema<IAdminSchema>(
  {
    email: {
      type: mongoose.Schema.Types.String,
      required: false,
      default: null,
    },
    username: { type: mongoose.Schema.Types.String, required: true },
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
  },
  { timestamps: true }
);

export const AdminTable = mongoose.model<IAdminSchema>(
  "admin",
  schema,
  "admin"
);
