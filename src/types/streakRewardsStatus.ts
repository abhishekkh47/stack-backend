import mongoose from "mongoose";

export interface IStreakRewardStatus {
  userId: mongoose.Schema.Types.ObjectId;
  rewardDayCaimed: number;
  rewardsClaimedAt: Date;
}
