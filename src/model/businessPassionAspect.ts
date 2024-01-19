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
  },
  { timestamps: true }
);

export const BusinessPassionAspectTable =
  mongoose.model<IBusinessPassionAspectSchema>(
    "business_passion_aspect",
    schema
  );
