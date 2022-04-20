import mongoose from "mongoose";

import type { ICMS, MongooseModel } from "@app/types";

export type ICMSType = MongooseModel<ICMS> & mongoose.Document;

const schema = new mongoose.Schema<ICMSType>({
  title: {
    type: mongoose.Schema.Types.String,
    required: true,
  },
  
  text: {
    type: mongoose.Schema.Types.String,
    required: true,
  },
  type: {
    type: mongoose.Schema.Types.Number,
    required: true,
  },
});
export const CMSTable = mongoose.model<ICMSType>("CMS", schema, "cms");
