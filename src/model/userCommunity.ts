import mongoose from "mongoose";
import type { IUserCommunity, MongooseModel } from "@app/types";
import { COMMUNITY_CHALLENGE_CLAIM_STATUS } from "@app/utility/constants";
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
      type: mongoose.Schema.Types.Number,
      enum: [
        COMMUNITY_CHALLENGE_CLAIM_STATUS.NOT_STARTED,
        COMMUNITY_CHALLENGE_CLAIM_STATUS.PENDING,
        COMMUNITY_CHALLENGE_CLAIM_STATUS.COMPLETED,
      ],
      default: COMMUNITY_CHALLENGE_CLAIM_STATUS.NOT_STARTED,
      required: true,
    },
  },
  { timestamps: true }
);
export const UserCommunityTable = mongoose.model<IUserCommunity>(
  "user_community",
  schema
);
