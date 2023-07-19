import mongoose from "mongoose";

import type { IDripshopReedem, MongooseModel } from "@app/types";

export type IDripshopSchema = MongooseModel<IDripshopReedem> &
  mongoose.Document;

const schema = new mongoose.Schema<IDripshopReedem>(
  {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "dripshopitem",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "user",
    },
    selectedSize: {
      type: mongoose.Schema.Types.String,
      default: null,
    },
    apartment: {
      type: mongoose.Schema.Types.String,
      default: null,
    },
    firstName: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    lastName: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    address: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    state: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    city: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    zipCode: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    redeemedFuels: {
      type: mongoose.Schema.Types.Number,
      required: true,
    },
  },
  { timestamps: true }
);

export const DripshopReedemTable = mongoose.model<IDripshopReedem>(
  "dripshop",
  schema,
  "dripshop_redeems"
);
