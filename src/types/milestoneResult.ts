import mongoose from "mongoose";

export interface IMilestoneResult {
  milestoneId: mongoose.Schema.Types.ObjectId;
  day: number;
  order: number;
}
