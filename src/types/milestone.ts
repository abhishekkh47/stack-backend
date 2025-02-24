import mongoose from "mongoose";

export interface IMilestone {
  topicId: mongoose.Schema.Types.ObjectId;
  milestone: string;
  description: string;
  order: number;
  locked: boolean;
  icon: string;
  iconBackgroundColor: string;
  stageId: mongoose.Schema.Types.ObjectId;
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
  dayTitle: string;
  roadmapIcon: string;
  level: number;
  levelImage: string;
  scoringCriteriaId: mongoose.Schema.Types.ObjectId;
  deliverableName: string;
  bestPractice: string;
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
