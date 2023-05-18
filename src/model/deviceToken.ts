import mongoose from "mongoose";

import type { IDeviceToken, MongooseModel } from "@app/types";

export type IDeviceTokenSchema = MongooseModel<IDeviceToken> &
  mongoose.Document;

const schema = new mongoose.Schema<IDeviceTokenSchema>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
    deviceToken: { type: mongoose.Schema.Types.Array, required: true },
  },
  { timestamps: true }
);

export const DeviceToken = mongoose.model<IDeviceTokenSchema>(
  "devicetoken",
  schema
);
