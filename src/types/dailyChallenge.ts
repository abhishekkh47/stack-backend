import mongoose from "mongoose";

export interface IDailyChallenge {
  userId: mongoose.Schema.Types.ObjectId;
  dailyGoalStatus: ICurrentDayChallenge[];
}

interface ICurrentDayChallenge {
  id: string;
  _id: string;
  day: number;
  milestoneId: mongoose.Schema.Types.ObjectId;
  title: string;
  dependency: string[];
  iconBackgroundColor: string;
  inputTemplate: IMilestoneGoalOptions;
  key: string;
  order: number;
  template: number;
  time: string;
  iconImage: string;
  isLocked: boolean;
  isCompleted: boolean;
}

interface IMilestoneGoalOptions {
  optionScreenTitle: string;
  options: IGoalOptions[];
}

interface IGoalOptions {
  title: string;
  description: string;
  type: number;
  image: string;
}
