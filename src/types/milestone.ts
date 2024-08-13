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
  icon: string;
  dependency: string[];
  template: EInputTemplate;
  options: IMilestoneGoalOptions;
}

enum EInputTemplate {
  "single_choice" = "single_choice",
  "checkbox" = "checkbox",
  "free_text" = "free_text",
}

interface IMilestoneGoalOptions {
  title: string;
  option: IGoalOptions[];
}

interface IGoalOptions {
  title: string;
  description: string;
  type: number;
  image: string;
}
