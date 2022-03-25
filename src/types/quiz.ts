import mongoose from "mongoose";

export interface IQuizTopic {
  topic: string;
  status: number;
}

export enum EQuizTopicStatus {
  ACTIVE = 1,
  INACTIVE = 0,
}

export interface IQuiz {
  quizName: string;
  topicId: mongoose.Schema.Types.ObjectId;
  points: number;
  videoUrl: string;
}