import mongoose from "mongoose";

import type { IQuizTopic, MongooseModel } from "../types";

export type IQuizTopicSchema = MongooseModel<IQuizTopic> & mongoose.Document;

const schema = new mongoose.Schema<IQuizTopicSchema>(
  {
    topic: { type: mongoose.Schema.Types.String, required: true },
    /**
     * 1 - Active and 0 - Inactive
     */
    status: { type: mongoose.Schema.Types.Number, default: 1 },
  },
  { timestamps: true }
);

export const QuizTopicTable = mongoose.model<IQuizTopicSchema>(
  "quizTopic",
  schema
);
