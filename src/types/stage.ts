import mongoose from "mongoose";

export interface IStage {
  categoryId: mongoose.Schema.Types.ObjectId;
  title: string;
  subTitle: string;
  description: string;
  guidebook: string[];
  colorCode: string;
  order: number;
}
