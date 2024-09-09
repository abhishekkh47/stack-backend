import mongoose from "mongoose";

import type { IAIToolDataSetTypes, MongooseModel } from "@app/types";

export type IAIToolDataSetTypesSchema = MongooseModel<IAIToolDataSetTypes> &
  mongoose.Document;

const schema = new mongoose.Schema<IAIToolDataSetTypesSchema>(
  {
    key: {
      type: mongoose.Schema.Types.String,
      required: true,
      default: null,
    },
    types: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      default: null,
    },
    datasetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "ai_tools_dataset",
    },
  },
  { timestamps: true }
);

export const AIToolDataSetTypesTable =
  mongoose.model<IAIToolDataSetTypesSchema>("ai_tools_dataset_types", schema);
