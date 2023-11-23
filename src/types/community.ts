import mongoose from "mongoose";
export interface ICommunity {
  name: string;
  googlePlaceId: string;
  createdBy: mongoose.Schema.Types.ObjectId;
  challenge: {
    type: string;
    xpGoal: number;
    endAt: Date;
    duration: number;
  };
  isStepFunctionScheduled: boolean;
}
export interface IUserCommunity {
  communityId: mongoose.Schema.Types.ObjectId;
  xpPoints: number;
  isVP: mongoose.Schema.Types.ObjectId;
  userId: mongoose.Schema.Types.ObjectId;
  reward: number;
  isClaimed: boolean;
}
