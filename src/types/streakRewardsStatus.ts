import mongoose from "mongoose";

export interface IStreakRewardStatus {
  userId: mongoose.Schema.Types.ObjectId;
  rewardDayClaimed: number;
  rewardsClaimedAt: number;
}
