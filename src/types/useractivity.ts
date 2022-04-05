import mongoose from "mongoose";
import { EUserType } from "./user";
export interface IUserActivity {
  userId: mongoose.Schema.Types.ObjectId;
  userType: EUserType;
  message: string;
  action: EAction;
  status: EStatus;
  currencyValue: number;
  currencyType: mongoose.Schema.Types.ObjectId;
}

export enum EAction {
  DEPOSIT = 1,
  WITHDRAW = 2,
  BUY_CRYPTO = 3,
  SELL_CRYPTO = 4,
}

export enum EStatus {
  PENDING = 1,
  PROCESSED = 2,
  CANCELLED = 3,
}

export const messages = {
  DEPOSIT: "Requested one time deposit",
  WITHDRAW: "Requested one time withdrawal",
};
