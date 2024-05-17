import mongoose from "mongoose";
export interface IBusinessPassion {
  title: string;
  image: string;
  order: number;
  businessImages: string[];
  type: number;
}

export interface IBusinessPassionAspect {
  aspect: string;
  businessPassionId: mongoose.Schema.Types.ObjectId;
  aspectImage: string;
  problems: string[];
  type: number;
}
