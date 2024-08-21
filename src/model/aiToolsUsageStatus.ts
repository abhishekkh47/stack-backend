import mongoose from "mongoose";

import type { IAIToolsUsageStatus, MongooseModel } from "@app/types";

export type IAIToolsUsageStatusSchema = MongooseModel<IAIToolsUsageStatus> &
  mongoose.Document;

const schema = new mongoose.Schema<IAIToolsUsageStatusSchema>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
      ref: "user",
    },
    description: {
      type: mongoose.Schema.Types.Boolean,
      required: true,
      default: false,
    },
    ideaValidation: {
      type: mongoose.Schema.Types.Boolean,
      required: true,
      default: false,
    },
    companyName: {
      type: mongoose.Schema.Types.Boolean,
      required: true,
      default: false,
    },
    companyLogo: {
      type: mongoose.Schema.Types.Boolean,
      required: true,
      default: false,
    },
    targetAudience: {
      type: mongoose.Schema.Types.Boolean,
      required: true,
      default: false,
    },
    competitors: {
      type: mongoose.Schema.Types.Boolean,
      required: true,
      default: false,
    },
    colorsAndAesthetic: {
      type: mongoose.Schema.Types.Boolean,
      required: true,
      default: false,
    },
    valueProposition: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
    unfairAdvantage: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
    marketingChannelStrategy: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
    keyMetrics: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
    businessModel: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
    costStructure: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
    shortPitch: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
    pitchId: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
    longPitch: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
    problemStory: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
    coreFeature: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
    unfairAdvantageOutline: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
    progress: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
    businessModelOutline: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
    marketSize: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
    whyNowStory: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
    theAsk: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
    outreachEmail: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
    connectionRequest: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
    investorTarget: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
    custExpWOProduct: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
    custExpWithProduct: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
    futureVision: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
    painPoint: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
    socialMediaDemand: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
    engagementLevel: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
    demandTestingStrategy: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
    postCopy: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
    visualAssetStrategy: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
    reflectDemandTest: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
    customerInterviewQuestions: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
    outreachMethod: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
    interviewOutreachMessage: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
    headline: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
    ctaInterestForm: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
    supportingVisualAsset: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
    outreachMessage: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
    targetUsersId: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
    customerInteractionGoal: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
    marketingChannel: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
    perfectHook: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
    postCopyScript: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
    callToAction: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
    cadence: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
    inspiration: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
    productUpdate: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
    productType: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
    keyProcess: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
    keyProcessSubAction: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
    thirdPartyIntegrations: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
    mvpFormat: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
    valueCreationProcess: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
    mvpSpecification: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
    feedbackMechanism: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
  },
  { timestamps: true }
);
export const AIToolsUsageStatusTable =
  mongoose.model<IAIToolsUsageStatusSchema>("ai_tools_usage_status", schema);
