import mongoose from "mongoose";

export interface IMilestone {
  topicId: mongoose.Schema.Types.ObjectId;
  milestone: string;
  description: string;
}

export interface IMilestoneGoals {
  milestoneId: mongoose.Schema.Types.ObjectId;
  day: number;
  title: string;
  key: string;
  order: number;
  time: string;
  iconImage: string;
  dependency: string[];
  template: number;
  iconBackgroundColor: string;
  inputTemplate: IMilestoneGoalOptions;
}

export enum EInputTemplate {
  SINGLE_CHOICE = 1,
  CHECKBOX = 2,
  FREETEXT = 3,
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
