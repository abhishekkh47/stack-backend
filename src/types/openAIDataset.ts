import mongoose from "mongoose";
export interface IAIToolDataSet {
  key: string;
  data: string;
}

export interface IIdeaGenerator {
  /* 1-physical product, 2-tech product, 3-idea validator */
  type: EIdeaGeneratorType;
  key: string;
  data: mongoose.Schema.Types.Mixed;
}

export enum EIdeaGeneratorType {
  PHYSICAL_PRODUCT = 1,
  TECH_PRODUCT = 2,
  IDEA_VALIDATOR = 3,
}
