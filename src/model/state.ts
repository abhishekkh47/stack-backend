import mongoose from "mongoose";

import type { IState, MongooseModel } from "@app/types";

export type IStateSchema = MongooseModel<IState> & mongoose.Document;

const schema = new mongoose.Schema<IStateSchema>(
  {
    name: { type: mongoose.Schema.Types.String },
  },
  { timestamps: true }
);

export const StateTable = mongoose.model<IStateSchema>("state", schema);
