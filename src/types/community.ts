import mongoose from "mongoose";

export interface ICommunity {
  createdBy: mongoose.Schema.Types.ObjectId;
  title: string;
}
