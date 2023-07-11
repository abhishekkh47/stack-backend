import mongoose from "mongoose";

export interface IDripshop {
  productId: mongoose.Schema.Types.ObjectId;
  userId: mongoose.Schema.Types.ObjectId;
  selectedSize: string;
  firstName: string;
  lastName: string;
  address: string;
  state: string;
  city: string;
  redeemedFuels: number;
  zipCode: string;
}
