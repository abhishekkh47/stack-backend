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
  competitors: IBusinessInfo[];
  keyDifferentiator: string;
  xForY: string;
  headline: string;
  valueCreators: string;
  colorsAndAesthetic: string;
  callToAction: string;
  linkYourBlog: string;
  linkYourWebsite: string;
  appName: string;
  homescreenImage: string;
  customerDiscovery: string;
  socialFeedback: string;
  productUpdate: string;
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

export interface IAIToolsUsageStatus {
  userId: mongoose.Schema.Types.ObjectId;
  description: boolean;
  ideaValidation: boolean;
  companyName: boolean;
  companyLogo: boolean;
  targetAudience: boolean;
  competitors: boolean;
  colorsAndAesthetic: boolean;
}

interface IBusinessInfo {
  _id: string;
  title: string;
  description: string;
}

interface ITargetAudience {
  _id: string;
  title: string;
  description: ITargetAudienceDesc;
}
interface ITargetAudienceDesc {
  Demographics: string;
  Psychographics: string;
  Population: string;
}
