import mongoose from "mongoose";
export interface ITransaction {
  userId: mongoose.Schema.Types.ObjectId;
  cryptoId: mongoose.Schema.Types.ObjectId;
  parentId: mongoose.Schema.Types.ObjectId; // optional if parent only then his/her id
  accountId: string;
  assetId: string;
  settledTime: string;
  status: ETransactionStatus;
  amount: number;
  amountMod: number;
  type: ETransactionType;
  executedQuoteId: string;
  unitCount: number;
  intialDeposit: boolean;
  recurringDeposit: boolean;
}

export enum ETransactionType {
  BUY = 1,
  SELL = 2,
  DEPOSIT = 3,
  WITHDRAW = 4,
}
export enum ETransactionStatus {
  PENDING = 1,
  SETTLED = 2,
  GIFTED = 3,
}
