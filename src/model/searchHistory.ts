import mongoose from "mongoose";

import type { IQuizSearchInput, MongooseModel } from "@app/types";

export type IQuizSearchInputSchema = MongooseModel<IQuizSearchInput> &
  mongoose.Document;

const schema = new mongoose.Schema<IQuizSearchInputSchema>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    searchInput: { type: mongoose.Schema.Types.String, required: true },
  },
  { timestamps: true }
);

export const SearchHistoryTable = mongoose.model<IQuizSearchInputSchema>(
  "search_history",
  schema,
  "search_history"
);
