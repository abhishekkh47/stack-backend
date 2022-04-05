import mongoose from "mongoose";
export interface IUserBalance {
  userId: mongoose.Schema.Types.ObjectId;
  balance: number;
}
