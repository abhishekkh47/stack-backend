import mongoose from "mongoose";

import type { IInterest, MongooseModel } from "@app/types";

export type IInterestSchema = MongooseModel<IInterest> & mongoose.Document;

const schema = new mongoose.Schema<IInterestSchema>(
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

export const InterestTable = mongoose.model<IInterestSchema>(
  "interest",
  schema
);
