import mongoose from "mongoose";

import type { PaymentTransaction, MongooseModel } from "@app/types";

export type PaymentTransactionSchema = MongooseModel<PaymentTransaction> &
  mongoose.Document;

const schema = new mongoose.Schema<PaymentTransactionSchema>(
  {
    giftCardId: {
      type: mongoose.Schema.Types.String,
      required: true,
      ref: "gift-card",
    },
    data: { type: mongoose.Schema.Types.Mixed, required: false, default: {} },
    method: { type: mongoose.Schema.Types.String, required: true },
    paymentMode: {
      type: mongoose.Schema.Types.String,
      required: true,
      default: "IN",
    },
  },
  { timestamps: true }
);

export const PaymentTransactionTable = mongoose.model<PaymentTransactionSchema>(
  "payment-transaction",
  schema
);
