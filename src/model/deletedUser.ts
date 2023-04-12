import mongoose from "mongoose";

import type { IDeletedUser, MongooseModel } from "@app/types";

export type IDeletedUserType = MongooseModel<IDeletedUser> & mongoose.Document;

const schema = new mongoose.Schema<IDeletedUserType>(
  {
    fullName: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    email: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    mobile: {
      type: mongoose.Schema.Types.String,
      required: false,
      default: null,
    },
    type: {
      type: mongoose.Schema.Types.Number,
      required: true,
    },
  },
  { timestamps: true }
);
export const DeletedUserTable = mongoose.model<IDeletedUserType>(
  "deletedUser",
  schema
);
