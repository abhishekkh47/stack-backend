import mongoose from "mongoose";
import type { IActionScoringCriteria, MongooseModel } from "@app/types";

export type IActionScoringCriteriaSchema =
  MongooseModel<IActionScoringCriteria> & mongoose.Document;

const schema = new mongoose.Schema<IActionScoringCriteriaSchema>({
  key: {
    type: mongoose.Schema.Types.String,
    required: true,
  },
  scoringCriteria: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    default: null,
  },
});

export const ActionScoringCriteriaTable =
  mongoose.model<IActionScoringCriteriaSchema>(
    "action_scoring_criteria",
    schema
  );
