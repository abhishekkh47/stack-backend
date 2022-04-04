import mongoose from "mongoose";

import type { IUser, MongooseModel } from "@app/types";

export type IUserSchema = MongooseModel<IUser> & mongoose.Document;

const schema = new mongoose.Schema<IUserSchema>(
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

export const AdminTable = mongoose.model<IUserSchema>("admin", schema, "admin");
