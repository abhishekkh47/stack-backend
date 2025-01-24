import mongoose from "mongoose";

import type { IStreakRewardStatus, MongooseModel } from "@app/types";

export type IStreakRewardStatusSchema = MongooseModel<IStreakRewardStatus> &
  mongoose.Document;

const schema = new mongoose.Schema<IStreakRewardStatusSchema>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      default: null,
      ref: "users",
    },
    rewardDayClaimed: {
      type: mongoose.Schema.Types.Number,
      required: true,
    },
    rewardsClaimedAt: {
      type: mongoose.Schema.Types.Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true }
);

export const StreakRewardStatusTable =
  mongoose.model<IStreakRewardStatusSchema>("streak_rewards_status", schema);
