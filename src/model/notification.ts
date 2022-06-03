import mongoose from "mongoose";

import type { INotification, MongooseModel } from "../types";

export type INotificationSchema = MongooseModel<INotification> &
  mongoose.Document;

const schema = new mongoose.Schema<INotificationSchema>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "user",
    },
    title: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    message: {
      type: mongoose.Schema.Types.String,
      required: false,
      default: null,
    },
    data: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    /**
     * 1 - unread and 2 - read
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
