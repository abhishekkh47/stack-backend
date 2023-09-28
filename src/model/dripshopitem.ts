import mongoose from "mongoose";

import type { IDripshopItem, MongooseModel } from "@app/types";

export type IDripshopItemSchema = MongooseModel<IDripshopItem> &
  mongoose.Document;

const schema = new mongoose.Schema<IDripshopItemSchema>(
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
    sizes: {
      type: mongoose.Schema.Types.Array,
      default: [],
      required: true,
    },
    shippable: {
      type: mongoose.Schema.Types.Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const DripshopItemTable = mongoose.model<IDripshopItemSchema>(
  "dripshopitem",
  schema
);
