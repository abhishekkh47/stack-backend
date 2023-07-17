import mongoose from "mongoose";

import type { ILeague, MongooseModel } from "@app/types";

export type ILeagueType = MongooseModel<ILeague> & mongoose.Document;

const schema = new mongoose.Schema<ILeagueType>(
  {
    name: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    image: {
      type: mongoose.Schema.Types.String,
      default: null,
    },
    colorCode: {
      type: mongoose.Schema.Types.String,
      default: null,
    },
    minPoint: {
      type: mongoose.Schema.Types.Number,
      required: true,
    },
    maxPoint: {
      type: mongoose.Schema.Types.Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);
export const LeagueTable = mongoose.model<ILeagueType>("league", schema);
