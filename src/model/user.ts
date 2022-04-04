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
    password: { type: mongoose.Schema.Types.String, required: true },
    username: { type: mongoose.Schema.Types.String, required: true },
    mobile: { type: mongoose.Schema.Types.String, required: true },
    address: { type: mongoose.Schema.Types.String, default: null },
    firstName: { type: mongoose.Schema.Types.String, required: true },
    lastName: { type: mongoose.Schema.Types.String, required: true },
    /**
     * 1 - teenager and 2 - parent
     */
    type: { type: mongoose.Schema.Types.Number, required: true },
    parentEmail: { type: mongoose.Schema.Types.String, default: null },
    parentMobile: { type: mongoose.Schema.Types.String, default: null },
  },
  { timestamps: true }
);

export const UserTable = mongoose.model<IUserSchema>("users", schema);
