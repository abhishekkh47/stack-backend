import mongoose from "mongoose";

import type { IUser, MongooseModel } from "@app/types";

export type IAdminSchema = MongooseModel<IUser> & mongoose.Document;

const schema = new mongoose.Schema<IAdminSchema>(
  {
    email: {
      type: mongoose.Schema.Types.String,
      required: false,
      default: null,
    },
    username: { type: mongoose.Schema.Types.String, required: true },
  },
  { timestamps: true }
);

export const AdminTable = mongoose.model<IAdminSchema>(
  "admin",
  schema,
  "admin"
);
