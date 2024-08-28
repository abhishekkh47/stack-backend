import mongoose from "mongoose";

import type { IBusinessProfile, MongooseModel } from "@app/types";

export type IBusinessProfileSchema = MongooseModel<IBusinessProfile> &
  mongoose.Document;

const schema = new mongoose.Schema<IBusinessProfileSchema>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
      ref: "user",
    },
    impacts: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "impact",
    },
    passions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "passion",
      },
    ],
    description: {
      type: mongoose.Schema.Types.String,
      required: false,
      default: null,
    },
    idea: {
      type: mongoose.Schema.Types.String,
      required: false,
      default: null,
    },
    marketOpportunity: {
      type: mongoose.Schema.Types.String,
      required: false,
      default: null,
    },
    companyName: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    companyLogo: {
      type: mongoose.Schema.Types.String,
      required: false,
      default: null,
    },
    targetAudience: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        demographics: {
          type: mongoose.Schema.Types.String,
          required: false,
        },
        psychographics: {
          type: mongoose.Schema.Types.String,
          required: false,
        },
        population: {
          type: mongoose.Schema.Types.String,
          required: false,
        },
      },
    },
    competitors: {
      _id: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    keyDifferentiator: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    xForY: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    headline: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    valueCreators: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    colorsAndAesthetic: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    callToAction: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    linkYourBlog: {
      type: mongoose.Schema.Types.String,
      required: false,
      default: null,
    },
    linkYourWebsite: {
      type: mongoose.Schema.Types.String,
      required: false,
      default: null,
    },
    appName: {
      type: mongoose.Schema.Types.String,
      required: false,
      default: null,
    },
    homescreenImage: {
      type: mongoose.Schema.Types.String,
      required: false,
      default: null,
    },
    customerDiscovery: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    socialFeedback: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    productUpdate: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    mvpHomeScreen: {
      type: mongoose.Schema.Types.String,
      required: false,
      default: null,
    },
    socialMediaAccountLink: {
      type: mongoose.Schema.Types.String,
      required: false,
      default: null,
    },
    firstPostLink: {
      type: mongoose.Schema.Types.String,
      required: false,
      default: null,
    },
    favoriteComment: {
      type: mongoose.Schema.Types.String,
      required: false,
      default: null,
    },
    aspiringSocialAccount: {
      type: mongoose.Schema.Types.String,
      required: false,
      default: null,
    },
    socialCampaignTheme: {
      type: mongoose.Schema.Types.String,
      required: false,
      default: null,
    },
    firstSocialCampaign: {
      type: mongoose.Schema.Types.String,
      required: false,
      default: null,
    },
    aiGeneratedSuggestions: [
      {
        type: mongoose.Schema.Types.Mixed,
        required: false,
        default: null,
      },
    ],
    isRetry: {
      type: mongoose.Schema.Types.Boolean,
      required: false,
      default: false,
    },
    hoursSaved: {
      type: mongoose.Schema.Types.Number,
      required: false,
      default: 0,
    },
    logoGenerationInfo: {
      isUnderProcess: {
        type: mongoose.Schema.Types.Boolean,
        required: false,
        default: false,
      },
      aiSuggestions: [
        {
          type: mongoose.Schema.Types.String,
          required: false,
          default: null,
        },
      ],
      startTime: {
        type: mongoose.Schema.Types.Number,
        required: false,
        default: 0,
      },
      isInitialSuggestionsCompleted: {
        type: mongoose.Schema.Types.Boolean,
        required: false,
        default: false,
      },
    },
    businessCoachInfo: {
      coachId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: "coach_profile",
      },
      initialMessage: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    enableStealthMode: {
      type: mongoose.Schema.Types.Boolean,
      required: false,
      default: false,
    },
    hoursPerWeek: {
      type: mongoose.Schema.Types.String,
      required: false,
      default: null,
    },
    technicalExperience: {
      type: mongoose.Schema.Types.String,
      required: false,
      default: null,
    },
    investments: {
      type: mongoose.Schema.Types.String,
      required: false,
      default: null,
    },
    /**
     * 1 - 'Physical Product' AND 2 - 'Software Technology' AND 3 - 'Content Brand'
     */
    businessType: {
      type: mongoose.Schema.Types.Number,
      required: false,
      default: 0,
    },
    businessPreferences: {
      passion: {
        type: mongoose.Schema.Types.String,
        required: false,
        default: null,
      },
      aspect: {
        type: mongoose.Schema.Types.String,
        required: false,
        default: null,
      },
      problem: {
        type: mongoose.Schema.Types.String,
        required: false,
        default: null,
      },
    },
    businessHistory: [
      {
        key: {
          type: mongoose.Schema.Types.String,
          required: false,
          default: null,
        },
        value: {
          type: mongoose.Schema.Types.Mixed,
          required: false,
          default: null,
        },
        timestamp: {
          type: mongoose.Schema.Types.Date,
          default: null,
          required: false,
        },
        image: {
          type: mongoose.Schema.Types.String,
          required: false,
          default: null,
        },
      },
    ],
    keyMetrics: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    valueProposition: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    marketingChannelStrategy: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    businessModel: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    costStructure: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    unfairAdvantage: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    completedGoal: {
      type: mongoose.Schema.Types.Number,
      required: false,
      default: 0,
    },
    currentMilestone: {
      milestoneId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "milestones",
        required: false,
        default: null,
      },
      milestoneUpdatedAt: {
        type: mongoose.Schema.Types.Date,
        required: false,
        default: new Date(),
      },
    },
    shortPitch: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    pitchId: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    longPitch: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    problemStory: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    coreFeature: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    unfairAdvantageOutline: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    progress: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    businessModelOutline: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    marketSize: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    whyNowStory: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    theAsk: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    outreachEmail: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    connectionRequest: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    investorCriteria: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    investorTarget: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    custExpWOProduct: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    custExpWithProduct: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    futureVision: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    painPoint: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    socialMediaDemand: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    engagementLevel: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    demandTestingStrategy: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    postCopy: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    visualAssetStrategy: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    reflectDemandTest: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    customerInterviewQuestions: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    outreachMethod: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    interviewOutreachMessage: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    ctaInterestForm: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    supportingVisualAsset: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    outreachMessage: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    targetUsersId: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    customerInteractionGoal: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    marketingChannel: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    perfectHook: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    postCopyScript: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    cadence: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    inspiration: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    productType: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    keyProcess: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    keyProcessSubAction: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    thirdPartyIntegrations: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    mvpFormat: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    valueCreationProcess: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    mvpSpecification: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    feedbackMechanism: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    yourHook: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    founderStory: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    showcaseProblem: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    gotoMarketStrategy: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    progressMetrics: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    unitEconomics: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    opitmizePitch: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    networkingStrategy: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    outreachDM: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    investorOutreachEmail: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    painPointSearchPhrase: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    socialDemand: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    customerExperienceMap: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    painPointOpportunity: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    outlineDemandTest: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    demandTestGoal: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    interviewPipelineStrategy: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    pipelineMessage: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    supportingVisual: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    targetUsersCommunity: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    defineMarketingChannelStrategy: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    developCallToAction: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    updateStrategy: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    updateCategories: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
    firstCompanyUpdate: {
      title: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
      description: {
        type: mongoose.Schema.Types.String,
        required: false,
      },
    },
  },
  { timestamps: true }
);
export const BusinessProfileTable = mongoose.model<IBusinessProfileSchema>(
  "business-profile",
  schema
);
