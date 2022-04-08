import mongoose from "mongoose";

import type { IAdmin, MongooseModel } from "@app/types";

export type IAdminSchema = MongooseModel<IAdmin> & mongoose.Document;

const schema = new mongoose.Schema<IAdminSchema>(
  {
    email: {
      type: mongoose.Schema.Types.String,
      required: false,
      default: null,
    },
    username: { type: mongoose.Schema.Types.String, required: true },
    jwtToken: { type: mongoose.Schema.Types.String, default: null },
  },
  { timestamps: true }
);

export const AdminTable = mongoose.model<IAdminSchema>(
  "admin",
  schema,
  "admin"
);
