import mongoose from "mongoose";

export interface IDripShop {
 cryptoId: mongoose.Schema.Types.ObjectId;
 assetId: string;
 requiredFuels: number;
 cryptoToBeRedeemed: number;
}
