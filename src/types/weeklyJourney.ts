import mongoose from "mongoose";
export interface IWeeklyJourney {
  title: string;
  day: number;
  week: number;
  actions: {
    actionNum: number;
    type: number;
    quizId: number;
    taskName: string;
    reward: number;
  };
  rewardType: number;
  reward: mongoose.Schema.Types.Mixed;
}
export interface IWeeklyJourneyResults {
  weeklyJourneyId: mongoose.Schema.Types.ObjectId;
  userId: mongoose.Schema.Types.ObjectId;
  actionNum: number;
  actionInput: string;
}
