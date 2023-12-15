import mongoose from "mongoose";
export interface IWeeklyJourney {
  title: string;
  day: number;
  week: number;
  dailyGoal: string;
  actions: {
    actionNum: number;
    type: number;
    quizId: number;
    taskName: string;
    actionInput: string;
    reward: number;
  };
  rewardType: number;
  reward: mongoose.Schema.Types.Mixed;
}
export interface IWeeklyJourneyResult {
  weeklyJourneyId: mongoose.Schema.Types.ObjectId;
  userId: mongoose.Schema.Types.ObjectId;
  actionNum: number;
  actionInput: string;
}
