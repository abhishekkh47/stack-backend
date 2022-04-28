import mongoose from "mongoose";

import type { InotifyUser, MongooseModel } from "../types";

export type INotifyUserSchema = MongooseModel<InotifyUser> & mongoose.Document;

const schema = new mongoose.Schema<INotifyUserSchema>(
  {
    email: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
  },
  { timestamps: true }
);

export const NotifyUserTable = mongoose.model<INotifyUserSchema>(
  "notifyUsers",
  schema
);
