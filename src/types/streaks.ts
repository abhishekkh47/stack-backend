import mongoose from "mongoose";
export interface IStreakGoal {
  day: number;
  title: string;
}

export interface IUserStreaks {
  userId: mongoose.Schema.Types.ObjectId;
  streakDate: string;
}
