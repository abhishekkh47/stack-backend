import mongoose from "mongoose";

export interface IQuizTopic {
  topic: string;
  status: number;
}

export enum EQuizTopicStatus {
  ACTIVE = 1,
  INACTIVE = 0,
}

export interface IQuizQuestion {
  quizId: mongoose.Schema.Types.ObjectId;
  question_image: string;
  text: string;
  question_type: EQuizQuestionType;
  answer_type: EQuizAnswerType;
  points: number;
  answer_array: IAnswerArray[];
  isOnboardingFlowQuiz: boolean
}

export enum EQuizQuestionType {
  BEST_ANSWER = 1,
  FILL_IN_BLANKS = 2,
  TRUE_FALSE = 3,
}

export enum ECorrectAnswer {
  TRUE = 1,
  FALSE = 0,
}

export enum EQuizAnswerType {
  TEXT = 1,
  IMAGE = 2,
}

export const everyCorrectAnswerPoints = 10;

export const timeBetweenTwoQuiz = 72.0;

export interface IAnswerArray {
  name: string;
  image: string;
  correct_answer: ECorrectAnswer;
  statement: string
}
export interface IQuiz {
  quizName: string;
  topicId: mongoose.Schema.Types.ObjectId;
  videoUrl: string;
}

export interface IQuizResult {
  topicId: mongoose.Schema.Types.ObjectId;
  userId: mongoose.Schema.Types.ObjectId;
  quizId: mongoose.Schema.Types.ObjectId;
  pointsEarned: number;
}

export interface IQuizQuestionResult extends IQuizResult {
  quizQuestionId: mongoose.Schema.Types.ObjectId;
}
