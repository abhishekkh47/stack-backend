import mongoose from "mongoose";

import type { ICryptoCurrency, MongooseModel } from "@app/types";

export type ICryptoCurrencySchema = MongooseModel<ICryptoCurrency> &
  mongoose.Document;

const schema = new mongoose.Schema<ICryptoCurrency>(
  {
    name: {
      type: mongoose.Schema.Types.String,
      required: true,
      unique: true,
    },
    image: {
      type: mongoose.Schema.Types.String,
      default: null,
    },
    symbol: {
      type: mongoose.Schema.Types.String,
      unique: true,
    },
    assetId: {
      type: mongoose.Schema.Types.String,
      unique: true,
    },
  },
  { timestamps: true }
);

export const CryptoTable = mongoose.model<ICryptoCurrency>("crypto", schema);
