import mongoose from "mongoose";

export interface IDailyChallenge {
  userId: mongoose.Schema.Types.ObjectId;
  dailyGoalStatus: ICurrentDayChallenge[];
}

interface ICurrentDayChallenge {
  id: string;
  title: string;
  key: string;
  time: string;
  isCompleted: boolean;
  categoryId: mongoose.Schema.Types.ObjectId;
}

interface ICurrentDayChallenge_ {
  id: string;
  _id: mongoose.Schema.Types.ObjectId;
  title: string;
  day: number;
  milestoneId: mongoose.Schema.Types.ObjectId;
  key: string;
  icon: string;
  order: number;
  time: string;
  isCompleted: boolean;
  isLocked: boolean;
  template: mongoose.Schema.Types.Mixed;
  categoryId: mongoose.Schema.Types.ObjectId;
}
