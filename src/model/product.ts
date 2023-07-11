import mongoose from "mongoose";

import type { IProduct, MongooseModel } from "@app/types";

export type IProductSchema = MongooseModel<IProduct> & mongoose.Document;

const schema = new mongoose.Schema<IProductSchema>(
  {
    name: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    image: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    fuel: {
      type: mongoose.Schema.Types.Number,
      required: true,
    },
    description: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    size: {
      type: mongoose.Schema.Types.Array,
      default: [],
      required: true,
    },
  },
  { timestamps: true }
);

export const ProductTable = mongoose.model<IProductSchema>("product", schema);
