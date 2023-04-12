import mongoose from "mongoose";

import type { IWebhook, MongooseModel } from "@app/types";

export type IWebhookType = MongooseModel<IWebhook> & mongoose.Document;

const schema = new mongoose.Schema<IWebhookType>(
  {
    title: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  { timestamps: true }
);
export const WebhookTable = mongoose.model<IWebhookType>("webhook", schema);
