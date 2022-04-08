import mongoose from "mongoose";

import type { IParentChild, MongooseModel } from "@app/types";

export type IParentChildType = MongooseModel<IParentChild> & mongoose.Document;

const schema = new mongoose.Schema<IParentChildType>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    contactId: {
      type: mongoose.Schema.Types.String,
      default: null,
    },
    firstChildId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    teens: [
      {
        childId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "users",
          required: true,
        },
        accountId: {
          type: mongoose.Schema.Types.String,
          default: null,
        },
      },
    ],
  },
  { timestamps: true }
);

export const ParentChildTable = mongoose.model<IParentChildType>(
  "parentchild",
  schema,
  "parentchild"
);
