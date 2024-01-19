import mongoose from "mongoose";

import type { IBusinessPassion, MongooseModel } from "@app/types";

export type IBusinessPassionSchema = MongooseModel<IBusinessPassion> &
  mongoose.Document;

const schema = new mongoose.Schema<IBusinessPassionSchema>(
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
    businessImages: [
      {
        type: mongoose.Schema.Types.String,
        required: true,
      },
    ],
  },
  { timestamps: true }
);

export const BusinessPassionTable = mongoose.model<IBusinessPassionSchema>(
  "business_passion",
  schema
);
