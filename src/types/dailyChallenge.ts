import mongoose from "mongoose";

// this collection stores the current days goals only for each user
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
  categoryId: mongoose.Schema.Types.ObjectId;
}

interface IMilestoneGoalOptions {
  optionsScreenInfo: any;
  questionScreenInfo: any;
  suggestionScreenInfo: any;
}

interface IGoalOptions {
  title: string;
  description: string;
  type: number;
  image: string;
}
