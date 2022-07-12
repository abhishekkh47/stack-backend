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
  REJECTED = 3,
  CANCELLED_SELF = 4,
}

export const messages = {
  DEPOSIT: "Requested one time deposit",
  WITHDRAW: "Requested one time withdrawal",
  BUY: "Requested",
  SELL: "Requested",
  REJECT_DEPOSIT: "Denied deposit request of",
  REJECT_WITHDRAW: "Denied withdraw request of",
  REJECT_BUY: "Denied",
  REJECT_SELL: "Denied",
  APPROVE_DEPOSIT: "Approved deposit request of",
  APPROVE_WITHDRAW: "Approved withdraw request of",
  APPROVE_BUY: "Approved",
  APPROVE_SELL: "Approved",
};
