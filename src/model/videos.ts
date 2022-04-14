import mongoose from "mongoose";

import type { IVideo, MongooseModel } from "@app/types";

export type IVideoSchema = MongooseModel<IVideo> & mongoose.Document;

const schema = new mongoose.Schema<IVideoSchema>(
  {
    videoCategory: { type: mongoose.Schema.Types.String, required: true },
    /**
     * 1 - Active , 0 - Inactive
     */
    status: { type: mongoose.Schema.Types.Number, default: 1 },
    videoList: [
      {
        title: {
          type: mongoose.Schema.Types.String,
          required: true,
        },
        thumbnail: {
          type: mongoose.Schema.Types.String,
          default: null,
        },
        position: {
          type: mongoose.Schema.Types.Number,
          required: true,
        },
        url: {
          type: mongoose.Schema.Types.String,
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

export const VideosTable = mongoose.model<IVideoSchema>("video", schema);
