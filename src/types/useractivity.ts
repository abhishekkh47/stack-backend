import mongoose from "mongoose";
import { EUserType } from "./user";
export interface IUserActivity {
  userId: mongoose.Schema.Types.ObjectId;
  userType: EUserType;
  message: string;
  action: EAction;
  status: EStatus;
  resourceId: string;
  currencyValue: number;
  currencyType: mongoose.Schema.Types.ObjectId;
  cryptoId: mongoose.Schema.Types.ObjectId;
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
  BUY: "Requested to buy crypto",
  SELL: "Requested to sell crypto",
  REJECT_DEPOSIT: "Rejected one time deposit request",
  REJECT_WITHDRAW: "Rejected one time withdrawal request",
  REJECT_BUY: "Rejected to buy crypto request",
  REJECT_SELL: "Rejected to sell crypto request",
  APPROVE_DEPOSIT: "Approved one time deposit request",
  APPROVE_WITHDRAW: "Approved one time withdrawal request",
  APPROVE_BUY: "Approved to buy crypto request",
  APPROVE_SELL: "Approved to sell crypto request",
};
