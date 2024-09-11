import { bool } from "aws-sdk/clients/signer";
import mongoose from "mongoose";
export interface IImpact {
  title: string;
  image: string;
  order: number;
}

export interface IPassion {
  title: string;
  image: string;
  order: number;
}

export interface IBusinessProfile {
  userId: mongoose.Schema.Types.ObjectId;
  impacts: mongoose.Schema.Types.ObjectId;
  passions: mongoose.Types.ObjectId[];
  description: string;
  idea: string;
  marketOpportunity: string;
  companyName: IBusinessInfo;
  companyLogo: string;
  targetAudience: ITargetAudience;
  competitors: IBusinessInfo;
  keyDifferentiator: IBusinessInfo;
  xForY: IBusinessInfo;
  headline: IBusinessInfo;
  valueCreators: IBusinessInfo;
  colorsAndAesthetic: IBusinessInfo;
  callToAction: IBusinessInfo;
  linkYourBlog: string;
  linkYourWebsite: string;
  appName: string;
  homescreenImage: string;
  customerDiscovery: IBusinessInfo;
  socialFeedback: IBusinessInfo;
  productUpdate: IBusinessInfo;
  mvpHomeScreen: string;
  socialMediaAccountLink: string;
  firstPostLink: string;
  favoriteComment: string;
  aspiringSocialAccount: string;
  socialCampaignTheme: string;
  firstSocialCampaign: string;
  aiGeneratedSuggestions: string[];
  isRetry: boolean;
  hoursSaved: number;
  logoGenerationInfo: ILogoGenerationInfo;
  businessCoachInfo: IBusinessCoachInfo;
  enableStealthMode: boolean;
  hoursPerWeek: string;
  technicalExperience: string;
  investments: string;
  businessType: number;
  businessPreferences: IBusinessPreferences;
  businessHistory: IBusinessHistory[];
  valueProposition: IBusinessInfo;
  keyMetrics: IBusinessInfo;
  marketingChannelStrategy: IBusinessInfo;
  businessModel: IBusinessInfo;
  costStructure: IBusinessInfo;
  unfairAdvantage: IBusinessInfo;
  completedGoal: number;
  currentMilestone: {
    milestoneId: mongoose.Schema.Types.ObjectId;
    milestoneUpdatedAt: mongoose.Schema.Types.Date;
  };
  completedActions: {
    [key: string]: string | IBusinessInfo;
  };
}

export interface ILogoGenerationInfo {
  isUnderProcess: boolean;
  aiSuggestions: string[];
  startTime: number;
  isInitialSuggestionsCompleted: boolean;
}

export interface IBusinessCoachInfo {
  coachId: mongoose.Schema.Types.ObjectId;
  initialMessage: string;
}

interface IBusinessPreferences {
  passion: string;
  aspect: string;
  problem: string;
}

interface IBusinessHistory {
  key: string;
  value: mongoose.Schema.Types.Mixed;
  timestamp: Date;
  image: string;
}

interface IBusinessInfo {
  _id: string;
  title: string;
  description: string;
}

interface ITargetAudience {
  _id: string;
  title: string;
  description: string;
}
interface ITargetAudienceDesc {
  demographics: string;
  psychographics: string;
  population: string;
}
