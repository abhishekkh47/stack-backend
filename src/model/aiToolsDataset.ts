import mongoose from "mongoose";

import type { IAIToolDataSet, MongooseModel } from "@app/types";

export type IAIToolDataSetSchema = MongooseModel<IAIToolDataSet> &
  mongoose.Document;

const schema = new mongoose.Schema<IAIToolDataSetSchema>(
  {
    /**
     * 0-AI Tools except idea generator, 1 - PHYSICAL_PRODUCT, 2 - TECH_PRODUCT , 3 - IDEA_VALIDATOR
     */
    type: {
      type: mongoose.Schema.Types.Number,
      required: true,
      default: 0,
    },
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
