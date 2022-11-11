import mongoose from "mongoose";
import type { ICryptoPrice, MongooseModel } from "../types";

export type ICryptoPriceSchema = MongooseModel<ICryptoPrice> &
  mongoose.Document;

const schema = new mongoose.Schema<ICryptoPriceSchema>(
  {
    assetId: {
      type: mongoose.Schema.Types.String,
      required: true,
      unique: true,
    },
    cryptoId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
      ref: "crypto",
    },
    symbol: {
      type: mongoose.Schema.Types.String,
      unique: true,
      required: true,
    },
    name: {
      type: mongoose.Schema.Types.String,
      unique: true,
      required: true,
    },
    high90D: {
      type: mongoose.Schema.Types.Number,
      default: null,
    },
    low90D: {
      type: mongoose.Schema.Types.Number,
      default: null,
    },
    high365D: {
      type: mongoose.Schema.Types.Number,
      default: null,
    },
    low365D: {
      type: mongoose.Schema.Types.Number,
      default: null,
    },
    currentPrice: {
      type: mongoose.Schema.Types.Number,
      default: null,
    },
    percent_change_30d: {
      type: mongoose.Schema.Types.Number,
      default: null,
    },
    percent_change_2y: {
      type: mongoose.Schema.Types.Number,
      default: null,
    },
    currencyType: {
      type: mongoose.Schema.Types.String,
      default: "USD",
    },
  },
  { timestamps: true }
);

export const CryptoPriceTable = mongoose.model<ICryptoPriceSchema>(
  "cryptoPrice",
  schema
);
