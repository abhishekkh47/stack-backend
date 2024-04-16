import mongoose from "mongoose";
export interface IChecklistResult {
  userId: mongoose.Schema.Types.ObjectId;
  topicId: mongoose.Schema.Types.ObjectId;
  categoryId: mongoose.Schema.Types.ObjectId;
  level: number;
  actionNum: number;
}
