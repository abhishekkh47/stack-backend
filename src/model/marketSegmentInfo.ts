import mongoose from "mongoose";

import type { IMarketSegmentInfo, MongooseModel } from "@app/types";

export type IMarketSegmentInfoType = MongooseModel<IMarketSegmentInfo> &
  mongoose.Document;

const schema = new mongoose.Schema<IMarketSegmentInfoType>(
  {
    marketSegment: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    /**
     * 1 - 'Physical Product' AND 2 - 'Software Technology' AND 3 - 'Content Brand'
     */
    businessType: {
      type: mongoose.Schema.Types.Number,
      required: true,
    },
    uniqueness: {
      rating: { type: mongoose.Schema.Types.Number, required: true },
      description: { type: mongoose.Schema.Types.String, required: true },
    },
    marketSize: {
      rating: { type: mongoose.Schema.Types.Number, required: true },
      description: { type: mongoose.Schema.Types.String, required: true },
    },
    complexity: {
      rating: { type: mongoose.Schema.Types.Number, required: true },
      description: { type: mongoose.Schema.Types.String, required: true },
    },
  },
  {
    timestamps: true,
  }
);
export const marketSegmentInfoTable = mongoose.model<IMarketSegmentInfoType>(
  "market_segment_info",
  schema
);
