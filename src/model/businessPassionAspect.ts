import mongoose from "mongoose";

import type { IBusinessPassionAspect, MongooseModel } from "@app/types";

export type IBusinessPassionAspectSchema =
  MongooseModel<IBusinessPassionAspect> & mongoose.Document;

const schema = new mongoose.Schema<IBusinessPassionAspectSchema>(
  {
    aspect: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    businessPassionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    aspectImage: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    problems: [
      {
        type: mongoose.Schema.Types.String,
        required: true,
      },
    ],
    /**
     * 1 - 'Physical Product' AND 2 - 'Software Technology' AND 3 - 'Content Brand'
     */
    type: {
      type: mongoose.Schema.Types.Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true }
);

export const BusinessPassionAspectTable =
  mongoose.model<IBusinessPassionAspectSchema>(
    "business_passion_aspect",
    schema
  );
