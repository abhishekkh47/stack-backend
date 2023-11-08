import mongoose from "mongoose";

import type { ICommunity, MongooseModel } from "@app/types";

export type ICommunitySchema = MongooseModel<ICommunity> & mongoose.Document;

const schema = new mongoose.Schema<ICommunitySchema>(
  {
    title: { type: mongoose.Schema.Types.String, required: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
  },
  { timestamps: true }
);

export const CommunityTable = mongoose.model<ICommunitySchema>(
  "community",
  schema
);
