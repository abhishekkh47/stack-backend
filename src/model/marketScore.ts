import mongoose from "mongoose";

import type { IMarketScore, MongooseModel } from "@app/types";

export type IMarketScoreSchema = MongooseModel<IMarketScore> &
  mongoose.Document;

const schema = new mongoose.Schema<IMarketScoreSchema>(
  {
    /**
     * type = 1 - 'Physical Product' AND 2 - 'Software Technology' AND 3 - 'Content Brand'
     */
    type: {
      type: mongoose.Schema.Types.Number,
      required: true,
    },
    marketSegment: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    hhiRating: {
      type: mongoose.Schema.Types.Number,
      required: true,
    },
    hhiExplanation: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    customerSatisfactionRating: {
      type: mongoose.Schema.Types.Number,
      required: true,
    },
    customerSatisfactionExplanation: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    ageIndexRating: {
      type: mongoose.Schema.Types.Number,
      required: true,
    },
    ageIndexExplanation: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    tamRating: {
      type: mongoose.Schema.Types.Number,
      required: true,
    },
    tamExplanation: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    cagrRating: {
      type: mongoose.Schema.Types.Number,
      required: true,
    },
    cagrExplanation: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    overallRating: {
      type: mongoose.Schema.Types.Number,
      required: true,
    },
  },
  { timestamps: true }
);

export const MarketScoreTable = mongoose.model<IMarketScoreSchema>(
  "market_score",
  schema
);
