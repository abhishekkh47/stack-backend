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

interface IUpdatedDay {
  day: number;
  month: number;
  year: number;
}

interface IStreak {
  current: number;
  longest: number;
  last5days: any[];
  updatedDate: IUpdatedDay;
}

export interface IBusinessProfile {
  userId: mongoose.Schema.Types.ObjectId;
  impacts: mongoose.Schema.Types.ObjectId;
  passions: mongoose.Types.ObjectId[];
  description: string;
  streakGoal: mongoose.Schema.Types.ObjectId;
  streak: IStreak;
}
