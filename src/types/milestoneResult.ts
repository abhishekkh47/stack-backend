import mongoose from "mongoose";

export interface IMilestoneResult {
  userId: mongoose.Schema.Types.ObjectId;
  topicId: mongoose.Schema.Types.ObjectId;
  milestoneId: mongoose.Schema.Types.ObjectId;
  day: number;
  order: number;
  goalId: mongoose.Schema.Types.ObjectId;
  identifier: string;
}
