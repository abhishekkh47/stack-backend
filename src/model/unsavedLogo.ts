import mongoose from "mongoose";
import moment from "moment";

import type { IUnsavedLogo, MongooseModel } from "@app/types";

export type IUnsavedLogoSchema = MongooseModel<IUnsavedLogo> &
  mongoose.Document;

const schema = new mongoose.Schema<IUnsavedLogoSchema>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    logoGeneratedAt: {
      type: mongoose.Schema.Types.Number,
      default: moment().unix(),
      required: true,
    },
  },
  { timestamps: true }
);

export const UnsavedLogoTable = mongoose.model<IUnsavedLogoSchema>(
  "unsaved_logo",
  schema
);
