import mongoose from "mongoose";

export interface IDeviceToken {
  userId: mongoose.Schema.Types.ObjectId;
  deviceToken: string;
}

export interface INotification {
  userId: mongoose.Schema.Types.ObjectId;
  title: string;
  message: string;
  data: string;
  isRead: ERead;
}

export enum ERead {
  READ = 2,
  UNREAD = 1,
}
