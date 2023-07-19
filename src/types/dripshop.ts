import mongoose from "mongoose";

export interface IDripshopReedem {
  itemId: mongoose.Schema.Types.ObjectId;
  userId: mongoose.Schema.Types.ObjectId;
  selectedSize: string;
  firstName: string;
  lastName: string;
  apartment: string;
  address: string;
  state: string;
  city: string;
  redeemedFuels: number;
  zipCode: string;
}
