import mongoose from "mongoose";

import type { GiftCardModel, MongooseModel } from "@app/types";

export type GiftCardSchema = MongooseModel<GiftCardModel> & mongoose.Document;

const schema = new mongoose.Schema<GiftCardSchema>(
  {
    senderEmail: { type: mongoose.Schema.Types.String, required: true },
    amount: { type: mongoose.Schema.Types.Number, required: true },
    sender: { type: mongoose.Schema.Types.String, required: true },
    deliveryDate: { type: mongoose.Schema.Types.Date, required: true },
    delivery: [
      {
        method: { type: mongoose.Schema.Types.String, required: true },
        receiver: { type: mongoose.Schema.Types.String, required: true },
        updatedAt: { type: mongoose.Schema.Types.Date, required: false },
        status: { type: mongoose.Schema.Types.String, required: false },
      },
    ],
    receiver: { type: mongoose.Schema.Types.String, required: true },
    message: {
      type: mongoose.Schema.Types.String,
      required: false,
      default: "",
    },
    payment: {
      id: { type: mongoose.Schema.Types.String, required: false, default: "" },
      paymentType: {
        type: mongoose.Schema.Types.String,
        required: false,
        default: "",
      },
    },
    hash: { type: mongoose.Schema.Types.String, required: true },
    redeemed: {
      type: mongoose.Schema.Types.String,
      required: false,
      default: "PENDING",
    },
  },
  { timestamps: true }
);

export const GiftCardTable = mongoose.model<GiftCardSchema>(
  "gift-card",
  schema
);
