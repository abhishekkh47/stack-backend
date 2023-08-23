import mongoose from "mongoose";

import type { IQuizTopicSuggestion, MongooseModel } from "@app/types";

export type IQuizTopicSuggestionSchema = MongooseModel<IQuizTopicSuggestion> &
  mongoose.Document;

const schema = new mongoose.Schema<IQuizTopicSuggestionSchema>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    topic: { type: mongoose.Schema.Types.String, required: true },
  },
  { timestamps: true }
);

export const QuizTopicSuggestionTable =
  mongoose.model<IQuizTopicSuggestionSchema>(
    "quizTopic_Suggestion",
    schema,
    "quiztopic_suggestions"
  );
