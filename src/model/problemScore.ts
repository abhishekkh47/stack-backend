import mongoose from "mongoose";

import type { IProblemScore, MongooseModel } from "@app/types";

export type IProblemScoreSchema = MongooseModel<IProblemScore> &
  mongoose.Document;

const schema = new mongoose.Schema<IProblemScoreSchema>(
  {
    /**
     * 1 - 'Physical Product' AND 2 - 'Software Technology' AND 3 - 'Content Brand'
     */
    type: {
      type: mongoose.Schema.Types.Number,
      required: true,
      default: 0,
    },
    problem: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    pricePointIndex: {
      type: mongoose.Schema.Types.Number,
      required: true,
    },
    pricePointExplanation: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    demandScore: {
      type: mongoose.Schema.Types.Number,
      required: true,
    },
    demandScoreExplanation: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    trendingScore: {
      type: mongoose.Schema.Types.Number,
      required: true,
    },
    trendingScoreExplanation: {
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

export const ProblemScoreTable = mongoose.model<IProblemScoreSchema>(
  "problem_score",
  schema
);
