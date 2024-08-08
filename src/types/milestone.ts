import mongoose from "mongoose";

export interface IMilestone {
  milestone: string;
  title: string;
  topicId: mongoose.Schema.Types.ObjectId;
  day: number;
  order: number;
  time: string;
  goals: IMilestoneGoals[];
}

interface IMilestoneGoals {
  order: number;
  title: string;
  key: string;
  template: number;
  time: string;
}
