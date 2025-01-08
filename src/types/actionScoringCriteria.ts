import mongoose from "mongoose";

export interface IActionScoringCriteria {
  key: string;
  scoringCriteria: mongoose.Schema.Types.Mixed;
}
