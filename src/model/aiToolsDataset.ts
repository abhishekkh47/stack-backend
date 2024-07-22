import mongoose from "mongoose";

import type { IAIToolDataSet, MongooseModel } from "@app/types";

export type IAIToolDataSetSchema = MongooseModel<IAIToolDataSet> &
  mongoose.Document;

const schema = new mongoose.Schema<IAIToolDataSetSchema>(
  {
    key: {
      type: mongoose.Schema.Types.String,
      required: true,
      default: null,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      default: null,
    },
  },
  { timestamps: true }
);

export const AIToolDataSetTable = mongoose.model<IAIToolDataSetSchema>(
  "ai_tools_dataset",
  schema
);
