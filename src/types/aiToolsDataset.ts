import mongoose from "mongoose";
export interface IAIToolDataSet {
  /* 0-AI tools except idea generator, 1-physical product idea gen, 2-tech product idea gen, 3-idea validator idea gen*/
  type: EIdeaGeneratorType;
  key: string;
  data: mongoose.Schema.Types.Mixed;
}

export enum EIdeaGeneratorType {
  OTHER_AI_TOOLS = 0,
  PHYSICAL_PRODUCT = 1,
  TECH_PRODUCT = 2,
  IDEA_VALIDATOR = 3,
}

export interface IAIToolDataSetTypes {
  key: string;
  types: mongoose.Schema.Types.Mixed;
  datasetId: mongoose.Schema.Types.ObjectId;
}
