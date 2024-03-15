import mongoose from "mongoose";
import type { IProUser, MongooseModel } from "@app/types";
export type IProUserSchema = MongooseModel<IProUser> & mongoose.Document;
const schema = new mongoose.Schema<IProUser>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "user",
    },
    productId: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    subscriptionStartAt: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    subscriptionExpireAt: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    price: {
      type: mongoose.Schema.Types.Number,
      required: false,
      default: 0,
    },
  },
  { timestamps: true }
);
export const ProUserTable = mongoose.model<IProUser>("pro_user", schema);
