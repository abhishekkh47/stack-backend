import mongoose, { ObjectId } from "mongoose";

export interface IQuizTopic {
  _id: ObjectId;
  topic: string;
  status: number;
  type: number;
  image: string;
  hasStages: boolean;
  order: number;
}

export interface IQuizTopicSuggestion {
  topic: string;
  userId: mongoose.Schema.Types.ObjectId;
}

export interface IQuizSearchInput {
  searchInput: string;
  userId: mongoose.Schema.Types.ObjectId;
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
  isOnboardingFlowQuiz: boolean;
  question_image_title: string;
  order: number;
  correctStatement: string;
  incorrectStatement: string;
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

export interface IAnswerArray {
  name: string;
  image: string;
  correct_answer: ECorrectAnswer;
  statement: string;
}
export interface IQuiz {
  quizName: string;
  topicId: mongoose.Schema.Types.ObjectId;
  categoryId: mongoose.Schema.Types.ObjectId;
  stageId: mongoose.Schema.Types.ObjectId;
  videoUrl: string;
  image: string;
  quizNum: number;
  tags: string;
  quizType: number;
  characterName: string;
  characterImage: string;
}

export interface IQuizResult {
  topicId: mongoose.Schema.Types.ObjectId;
  userId: mongoose.Schema.Types.ObjectId;
  quizId: mongoose.Schema.Types.ObjectId;
  pointsEarned: number;
  isOnBoardingQuiz: boolean;
  numOfIncorrectAnswers: number;
}

export interface IQuizReview {
  userId: mongoose.Schema.Types.ObjectId;
  quizId: mongoose.Schema.Types.ObjectId;
  quizName: string;
  difficultyLevel: number;
  funLevel: number;
  wantMore: number;
  ratings: number;
  feedback: string[];
}

export interface IQuizQuestionResult extends IQuizResult {
  quizQuestionId: mongoose.Schema.Types.ObjectId;
}

export interface IQuizCategory {
  topicId: mongoose.Schema.Types.ObjectId;
  order: number;
  title: string;
  description: string;
}

export interface IQuizLevel {
  topicId: mongoose.Schema.Types.ObjectId;
  categoryId: mongoose.Schema.Types.ObjectId;
  level: number;
  title: string;
  actions: IQuizDetail[];
}

export interface IQuizDetail {
  actionNum: number;
  quizId: mongoose.Schema.Types.ObjectId;
  quizNum: number;
  type: string;
  reward: number;
}
