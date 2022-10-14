import mongoose from "mongoose";

export interface ICryptoPrice {
  assetId: string;
  cryptoId: mongoose.Schema.Types.ObjectId;
  symbol: string;
  name: string;
  high90D: number;
  low90D: number;
  high365D: number;
  low365D: number;
  currentPrice: number;
  currencyType: string;
  percent_change_30d: number;
}
