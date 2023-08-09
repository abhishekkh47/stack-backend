import mongoose from "mongoose";

import type { IImpact, MongooseModel } from "@app/types";

export type IImpactSchema = MongooseModel<IImpact> & mongoose.Document;

const schema = new mongoose.Schema<IImpactSchema>(
  {
    title: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    image: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.Number,
      required: true,
    },
  },
  { timestamps: true }
);

export const ImpactTable = mongoose.model<IImpactSchema>("impact", schema);
