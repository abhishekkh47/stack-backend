import mongoose from "mongoose";

import type { IVideo, MongooseModel } from "../types";

export type IVideoSchema = MongooseModel<IVideo> & mongoose.Document;

const schema = new mongoose.Schema<IVideoSchema>(
  {
    videoCategory: { type: mongoose.Schema.Types.String, required: true },
    /**
     * 1 - Active , 0 - Inactive
     */
    status: { type: mongoose.Schema.Types.Number, default: 1 },
    data: [
      {
        coverImage: {
          type: mongoose.Schema.Types.String,
          default: null,
        },
        images: {
          type: mongoose.Schema.Types.Array,
          default: null,
        },
      },
    ],
  },
  { timestamps: true }
);

export const VideosTable = mongoose.model<IVideoSchema>("video", schema);
