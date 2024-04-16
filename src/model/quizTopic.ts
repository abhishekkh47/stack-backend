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
    hasStages: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
    /**
     * 0/null - old quiz, 1 - new quiz, 3 Story quizzes, 4 - checklist topics
     */
    type: {
      type: mongoose.Schema.Types.Number,
      default: null,
    },
    order: {
      type: mongoose.Schema.Types.Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export const QuizTopicTable = mongoose.model<IQuizTopicSchema>(
  "quizTopic",
  schema
);

/*

Topic, aka, category:

- Type
 type = 1 means new space school teen quizzes.
- Category:
 Crypto - for parent quizzes
 Onboarding Quiz Topic - for teens during the onboarding

Topic is currently being used for deciding whether a quiz is new or not (by the type field)

*/
