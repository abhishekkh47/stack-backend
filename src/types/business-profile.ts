import mongoose from "mongoose";
export interface IImpact {
  title: string;
  image: string;
  order: number;
}

export interface IPassion {
  title: string;
  image: string;
  order: number;
}

interface IStreak {
  currentStreak: number;
  longestStreak: number;
  updatedStreakDate: string;
}

export interface IBusinessProfile {
  userId: mongoose.Schema.Types.ObjectId;
  impacts: mongoose.Schema.Types.ObjectId;
  passions: mongoose.Types.ObjectId[];
  description: string;
  streakGoal: mongoose.Schema.Types.ObjectId;
  streaks: IStreak;
}
