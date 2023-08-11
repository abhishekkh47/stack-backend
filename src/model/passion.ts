import mongoose from "mongoose";

import type { IPassion, MongooseModel } from "@app/types";

export type IPassionSchema = MongooseModel<IPassion> & mongoose.Document;

const schema = new mongoose.Schema<IPassionSchema>(
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

export const PassionTable = mongoose.model<IPassionSchema>("passion", schema);
