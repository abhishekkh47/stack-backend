import mongoose from "mongoose";

export interface IAIToolsUsageStatus {
  userId: mongoose.Schema.Types.ObjectId;
  description: boolean;
  ideaValidation: boolean;
  companyName: boolean;
  companyLogo: boolean;
  targetAudience: boolean;
  competitors: boolean;
  colorsAndAesthetic: boolean;
  valueProposition: boolean;
  unfairAdvantage: boolean;
  marketingChannelStrategy: boolean;
  keyMetrics: boolean;
  businessModel: boolean;
  costStructure: boolean;
  usedAITools: {
    [key: string]: boolean;
  };
}
