import mongoose from "mongoose";
export interface IImpact {
  title: string;
  image: string;
  order: number;
}

export interface IPassion {
  title: string;
  image: string;
  order: number;
}

export interface IBusinessProfile {
  userId: mongoose.Schema.Types.ObjectId;
  impacts: mongoose.Schema.Types.ObjectId;
  passions: mongoose.Types.ObjectId[];
  description: string;
  businessLogo: string;
  businessName: string;
  competitors: string;
  keyDifferentiators: string;
  targetAudience: string;
  coreStrategy: string;
}
