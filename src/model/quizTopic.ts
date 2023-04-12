import mongoose from "mongoose";

import type { IQuizTopic, MongooseModel } from "@app/types";

export type IQuizTopicSchema = MongooseModel<IQuizTopic> & mongoose.Document;

const schema = new mongoose.Schema<IQuizTopicSchema>(
  {
    topic: { type: mongoose.Schema.Types.String, required: true },
    /**
     * 1 - Active and 0 - Inactive
     */
    status: { type: mongoose.Schema.Types.Number, default: 1 },
    image: {
      type: mongoose.Schema.Types.String,
      default: null,
    },
    /**
     * 0/null - old quiz, 1 - new quiz
     */
    type: {
      type: mongoose.Schema.Types.Number,
      default: null,
    },
  },
  { timestamps: true }
);

export const QuizTopicTable = mongoose.model<IQuizTopicSchema>(
  "quizTopic",
  schema
);
