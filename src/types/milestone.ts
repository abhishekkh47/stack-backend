import mongoose from "mongoose";

export interface IMilestone {
  topicId: mongoose.Schema.Types.ObjectId;
  milestone: string;
  description: string;
  order: number;
  locked: boolean;
  icon: string;
  iconBackgroundColor: string;
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
  isAiToolbox: boolean;
}

export enum EInputTemplate {
  SINGLE_CHOICE = 1,
  CHECKBOX = 2,
  FREETEXT = 3,
}

interface IMilestoneGoalOptions {
  optionsScreenInfo: {
    title: string;
    options: IGoalOptions[];
  };
  questionScreenInfo: {
    title: string;
  };
}

interface IGoalOptions {
  title: string;
  description: string;
  type: number;
  image: string;
}
