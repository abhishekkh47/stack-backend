import mongoose from "mongoose";

export interface IDripshop {
  cryptoId: mongoose.Schema.Types.ObjectId;
  assetId: string;
  requiredFuels: number;
  cryptoToBeRedeemed: number;
}
