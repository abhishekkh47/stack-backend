import mongoose from "mongoose";

export interface IProUser {
  userId: mongoose.Schema.Types.ObjectId;
  productId: string;
  subscriptionStartAt: string;
  subscriptionExpireAt: string;
  price: number;
}
