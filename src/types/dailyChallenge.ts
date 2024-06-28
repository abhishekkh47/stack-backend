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
