import mongoose from "mongoose";
import type { IActionScoringCriteria, MongooseModel } from "@app/types";

export type IActionScoringCriteriaSchema =
  MongooseModel<IActionScoringCriteria> & mongoose.Document;

const schema = new mongoose.Schema<IActionScoringCriteriaSchema>({
  key: {
    type: mongoose.Schema.Types.String,
    required: true,
  },
  scoringCriteria: [
    {
      name: {
        type: mongoose.Schema.Types.String,
        required: true,
      },
      icon: {
        type: mongoose.Schema.Types.String,
        required: true,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: true,
      },
    },
  ],
});

export const ActionScoringCriteriaTable =
  mongoose.model<IActionScoringCriteriaSchema>(
    "action_scoring_criteria",
    schema
  );
