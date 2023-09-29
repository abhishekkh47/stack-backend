import mongoose from "mongoose";

import type { IQuiz, MongooseModel } from "@app/types";

export type IQuizSchema = MongooseModel<IQuiz> & mongoose.Document;

const schema = new mongoose.Schema<IQuizSchema>(
  {
    quizName: { type: mongoose.Schema.Types.String, required: true },
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "quizTopic",
    },
    stageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "stage",
      default: null,
    },
    image: {
      type: mongoose.Schema.Types.String,
      default: null,
    },
    quizNum: {
      type: mongoose.Schema.Types.Number,
      default: 0,
    },
    tags: {
      type: mongoose.Schema.Types.String,
      default: "",
    },
    videoUrl: { type: mongoose.Schema.Types.String, default: null },
    /**
     * 1 - quiz , 2 - simulation
     */
    quizType: { type: mongoose.Schema.Types.Number, default: 1 },
    characterName: { type: mongoose.Schema.Types.String, default: null },
    characterImage: { type: mongoose.Schema.Types.String, default: null },
  },
  { timestamps: true }
);

export const QuizTable = mongoose.model<IQuizSchema>("quiz", schema, "quiz");
