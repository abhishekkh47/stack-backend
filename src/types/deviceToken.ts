import mongoose from "mongoose";

export interface IDeviceToken {
  userId: mongoose.Schema.Types.ObjectId;
  deviceToken: string;
}

export interface INotification {
  userId: mongoose.Schema.Types.ObjectId;
  message: string;
  isRead: ERead;
}

export enum ERead {
  READ = 1,
  UNREAD = 2,
}
