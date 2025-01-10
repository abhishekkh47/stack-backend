import mongoose from "mongoose";

import type { IDripshopItem, MongooseModel, IStreakRewards } from "@app/types";

export type IDripshopItemSchema = MongooseModel<IStreakRewards> &
  mongoose.Document;

const schema = new mongoose.Schema<IDripshopItemSchema>(
  {
    name: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    image: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    fuel: {
      type: mongoose.Schema.Types.Number,
      required: false,
      default: 0,
    },
    description: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    sizes: [
      {
        type: mongoose.Schema.Types.Array,
        default: [],
        required: true,
      },
    ],
    day: {
      type: mongoose.Schema.Types.Number,
      required: true,
      default: 0,
    },
    rewardType: {
      type: mongoose.Schema.Types.Number,
      required: true,
      default: 1,
    },
    reward: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      default: null,
    },
    /**
     * type = 1 is to identify streak rewards
     */
    type: {
      type: mongoose.Schema.Types.Number,
      required: true,
      default: 1,
    },
  },
  { timestamps: true }
);

export const DripshopItemTable = mongoose.model<IDripshopItemSchema>(
  "dripshopitem",
  schema
);
