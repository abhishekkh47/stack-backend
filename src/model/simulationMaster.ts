import mongoose from "mongoose";

import type { ISimulationMaster, MongooseModel } from "@app/types";

export type ISimulationMasterSchema = MongooseModel<ISimulationMaster> &
  mongoose.Document;

const schema = new mongoose.Schema<ISimulationMasterSchema>(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "quiz",
      required: true,
    },
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "quizTopic",
      required: true,
    },
    stageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "stage",
      required: true,
    },
    title: { type: mongoose.Schema.Types.String, required: true },
    image: { type: mongoose.Schema.Types.String, required: true },
    characterName: { type: mongoose.Schema.Types.String, required: true },
    characterImage: { type: mongoose.Schema.Types.String, required: true },
    simulationQuestions: [
      {
        question: {
          type: mongoose.Schema.Types.String,
          required: true,
        },
        correctStatement: {
          type: mongoose.Schema.Types.String,
          required: true,
        },
        incorrectStatement: {
          type: mongoose.Schema.Types.String,
          required: true,
        },
        answers: [
          {
            title: {
              type: mongoose.Schema.Types.String,
              required: true,
            },
            statement: {
              type: mongoose.Schema.Types.String,
              required: true,
            },
            /**
             * 1 - True and  0 - False
             */
            correctAnswer: {
              type: mongoose.Schema.Types.Number,
              required: true,
            },
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

export const StateTable = mongoose.model<ISimulationMasterSchema>(
  "simulation_master",
  schema,
  "simulation_master"
);
