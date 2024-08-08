import mongoose from "mongoose";

export interface IUnsavedLogo {
  userId: mongoose.Schema.Types.ObjectId;
  logoGeneratedAt: number;
}
