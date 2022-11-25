import mongoose from "mongoose";

import type { IDripshop, MongooseModel } from "../types";

export type IDripshopSchema = MongooseModel<IDripshop> & mongoose.Document;

const schema = new mongoose.Schema<IDripshop>(
  {
    cryptoId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
      ref: "crypto",
    },
    assetId: {
      type: mongoose.Schema.Types.String,
      required: true,
      unique: true,
    },
    requiredFuels: {
      type: mongoose.Schema.Types.Number,
      required: false,
      default: 0,
    },
    cryptoToBeRedeemed: {
      type: mongoose.Schema.Types.Number,
      required: false,
      default: 0,
    },
  },
  { timestamps: true }
);

export const DripShopTable = mongoose.model<IDripshop>("dripshop", schema);
