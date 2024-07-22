import mongoose from "mongoose";

import type { IIdeaGenerator, MongooseModel } from "@app/types";

export type IIdeaGeneratorSchema = MongooseModel<IIdeaGenerator> &
  mongoose.Document;

const schema = new mongoose.Schema<IIdeaGeneratorSchema>(
  {
    /**
     * 1 - PHYSICAL_PRODUCT, 2 - TECH_PRODUCT , 3 - IDEA_VALIDATOR
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

export const IdeaGeneratorDataSetTable = mongoose.model<IIdeaGeneratorSchema>(
  "idea_generator_dataset",
  schema
);
