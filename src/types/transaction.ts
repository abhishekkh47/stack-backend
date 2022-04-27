import mongoose from "mongoose";
export interface ITransaction {
  userId: mongoose.Schema.Types.ObjectId;
  cryptoId: mongoose.Schema.Types.ObjectId;
  parentId: mongoose.Schema.Types.ObjectId; // optional if parent only then his/her id
  accountId: string;
  assetId: string;
  settledTime: string;
  amount: number;
  type: ETransactionType;
  unitCount: number;
}

export enum ETransactionType {
  BUY = 1,
  SELL = 2,
}
