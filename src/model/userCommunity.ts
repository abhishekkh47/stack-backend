import mongoose from "mongoose";
import type { IUserCommunity, MongooseModel } from "@app/types";
export type IUserCommunitySchema = MongooseModel<IUserCommunity> &
  mongoose.Document;
const schema = new mongoose.Schema<IUserCommunity>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "user",
    },
    communityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "community",
    },
    xpPoints: {
      type: mongoose.Schema.Types.Number,
      default: 0,
    },
    isVP: {
      type: mongoose.Schema.Types.Boolean,
      required: true,
    },
    isClaimed: {
      type: mongoose.Schema.Types.Boolean,
      required: true,
      default: false,
    },
  },
  { timestamps: true }
);
export const UserCommunityTable = mongoose.model<IUserCommunity>(
  "user_community",
  schema
);
