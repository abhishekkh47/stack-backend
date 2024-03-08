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
    marketOpportunity: {
      type: mongoose.Schema.Types.String,
      required: false,
      default: null,
    },
    companyName: {
      type: mongoose.Schema.Types.String,
      required: false,
      default: null,
    },
    companyLogo: {
      type: mongoose.Schema.Types.String,
      required: false,
      default: null,
    },
    targetAudience: {
      type: mongoose.Schema.Types.String,
      required: false,
      default: null,
    },
    competitors: {
      type: mongoose.Schema.Types.String,
      required: false,
      default: null,
    },
    keyDifferentiator: {
      type: mongoose.Schema.Types.String,
      required: false,
      default: null,
    },
    xForY: {
      type: mongoose.Schema.Types.String,
      required: false,
      default: null,
    },
    headline: {
      type: mongoose.Schema.Types.String,
      required: false,
      default: null,
    },
    valueCreators: {
      type: mongoose.Schema.Types.String,
      required: false,
      default: null,
    },
    colorsAndAesthetic: {
      type: mongoose.Schema.Types.String,
      required: false,
      default: null,
    },
    callToAction: {
      type: mongoose.Schema.Types.String,
      required: false,
      default: null,
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
      type: mongoose.Schema.Types.String,
      required: false,
      default: null,
    },
    socialFeedback: {
      type: mongoose.Schema.Types.String,
      required: false,
      default: null,
    },
    productUpdate: {
      type: mongoose.Schema.Types.String,
      required: false,
      default: null,
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
  },
  { timestamps: true }
);
export const BusinessProfileTable = mongoose.model<IBusinessProfileSchema>(
  "business-profile",
  schema
);
