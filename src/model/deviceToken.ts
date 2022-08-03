import mongoose from "mongoose";

import type { IDeviceToken, MongooseModel } from "../types";

export type IDeviceTokenSchema = MongooseModel<IDeviceToken> &
  mongoose.Document;

const schema = new mongoose.Schema<IDeviceTokenSchema>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
    // change from array to string db model design for device token
    deviceToken: { type: mongoose.Schema.Types.String, required: true },
  },
  { timestamps: true }
);

export const DeviceToken = mongoose.model<IDeviceTokenSchema>(
  "devicetoken",
  schema
);
