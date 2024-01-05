import mongoose from "mongoose";

import type { IPassionSubCategory, MongooseModel } from "@app/types";

export type IPassionSubCategorySchema = MongooseModel<IPassionSubCategory> &
  mongoose.Document;

const schema = new mongoose.Schema<IPassionSubCategorySchema>(
  {
    subCategory: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    passionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    subCategoryImage: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    problem: [
      {
        type: mongoose.Schema.Types.String,
        required: true,
      },
    ],
  },
  { timestamps: true }
);

export const PassionSubCategoryTable =
  mongoose.model<IPassionSubCategorySchema>("passion_sub_category", schema);
