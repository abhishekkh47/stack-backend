import mongoose from "mongoose";

import type { IStage, MongooseModel } from "@app/types";

export type IStageSchema = MongooseModel<IStage> & mongoose.Document;

const schema = new mongoose.Schema<IStageSchema>(
  {
    title: { type: mongoose.Schema.Types.String, required: true },
    subTitle: {
      type: mongoose.Schema.Types.String,
      required: true,
      default: null,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "quizTopic",
      required: true,
    },
    description: {
      type: mongoose.Schema.Types.String,
      required: true,
      default: null,
    },
    guidebookColor: {
      type: mongoose.Schema.Types.String,
      required: true,
      default: null,
    },
    backgroundColor: {
      type: mongoose.Schema.Types.String,
      required: true,
      default: null,
    },
    guidebook: {
      type: [mongoose.Schema.Types.String],
      required: true,
      default: null,
    },
    order: { type: mongoose.Schema.Types.Number, required: true, default: 0 },
    /* 
    type = 0 => old stages
    type = 1 => milestone stages
    */
    type: { type: mongoose.Schema.Types.Number, required: true, default: 0 },
  },
  { timestamps: true }
);

export const StageTable = mongoose.model<IStageSchema>("stage", schema);

/*

Topic, aka, category:

- Type
 type = 1 means new space school teen quizzes.
- Category:
 Crypto - for parent quizzes
 Onboarding Quiz Topic - for teens during the onboarding

Topic is currently being used for deciding whether a quiz is new or not (by the type field)

*/
