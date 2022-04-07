import mongoose from "mongoose";

export interface IParentChild {
  userId: mongoose.Schema.Types.ObjectId;
  teens: [];
}
