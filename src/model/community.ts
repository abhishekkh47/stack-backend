import mongoose from "mongoose";

import { CHALLENGE_TYPE } from "@app/utility/constants";
import type { ICommunity, MongooseModel } from "@app/types";

export type ICommunitySchema = MongooseModel<ICommunity> & mongoose.Document;
const schema = new mongoose.Schema<ICommunity>(
  {
    name: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    googlePlaceId: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "user",
    },
    challenge: {
      type: {
        type: mongoose.Schema.Types.String,
        enum: CHALLENGE_TYPE,
        required: true,
      },
      xpGoal: {
        type: mongoose.Schema.Types.Number,
        default: 0,
      },
      endAt: {
        type: mongoose.Schema.Types.Date,
        default: null,
      },
      reward: {
        type: mongoose.Schema.Types.Number,
        default: 0,
      },
    },
    isStepFunctionScheduled: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
  },
  { timestamps: true }
);
export const CommunityTable = mongoose.model<ICommunity>("community", schema);
