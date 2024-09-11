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
    completedActions: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);
export const BusinessProfileTable = mongoose.model<IBusinessProfileSchema>(
  "business-profile",
  schema
);
