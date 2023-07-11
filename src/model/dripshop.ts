import mongoose from "mongoose";

import type { IDripshop, MongooseModel } from "@app/types";

export type IDripshopSchema = MongooseModel<IDripshop> & mongoose.Document;

const schema = new mongoose.Schema<IDripshop>(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "product",
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

export const DripshopTable = mongoose.model<IDripshop>("dripshop", schema);
