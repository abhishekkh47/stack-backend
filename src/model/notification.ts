import mongoose from "mongoose";

import type { INotification, MongooseModel } from "../types";

export type INotificationSchema = MongooseModel<INotification> &
  mongoose.Document;

const schema = new mongoose.Schema<INotificationSchema>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    message: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    /**
     * 1 - read and 2 - unread
     */
    isRead: {
      type: mongoose.Schema.Types.Number,
      required: true,
    },
  },
  { timestamps: true }
);

export const Notification = mongoose.model<INotificationSchema>(
  "notification",
  schema,
  "notification"
);
