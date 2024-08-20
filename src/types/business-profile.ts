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
  shortPitch: IBusinessInfo;
  pitchId: IBusinessInfo;
  longPitch: IBusinessInfo;
  problemStory: IBusinessInfo;
  coreFeature: IBusinessInfo;
  unfairAdvantageOutline: IBusinessInfo;
  progress: IBusinessInfo;
  businessModelOutline: IBusinessInfo;
  marketSize: IBusinessInfo;
  whyNowStory: IBusinessInfo;
  theAsk: IBusinessInfo;
  outreachEmail: IBusinessInfo;
  connectionRequest: IBusinessInfo;
  investorCriteria: IBusinessInfo;
  investorTarget: IBusinessInfo;
  custExpWOProduct: IBusinessInfo;
  custExpWithProduct: IBusinessInfo;
  futureVision: IBusinessInfo;
  painPoint: IBusinessInfo;
  socialMediaDemand: IBusinessInfo;
  engagementLevel: IBusinessInfo;
  demandTestingStrategy: IBusinessInfo;
  postCopy: IBusinessInfo;
  visualAssetStrategy: IBusinessInfo;
  reflectDemandTest: IBusinessInfo;
  customerInterviewQuestions: IBusinessInfo;
  outreachMethod: IBusinessInfo;
  interviewOutreachMessage: IBusinessInfo;
  ctaInterestForm: IBusinessInfo;
  supportingVisualAsset: IBusinessInfo;
  outreachMessage: IBusinessInfo;
  targetUsersId: IBusinessInfo;
  customerInteractionGoal: IBusinessInfo;
  marketingChannel: IBusinessInfo;
  perfectHook: IBusinessInfo;
  postCopyScript: IBusinessInfo;
  cadence: IBusinessInfo;
  inspiration: IBusinessInfo;
  productType: IBusinessInfo;
  keyProcess: IBusinessInfo;
  keyProcessSubAction: IBusinessInfo;
  thirdPartyIntegrations: IBusinessInfo;
  mvpFormat: IBusinessInfo;
  valueCreationProcess: IBusinessInfo;
  mvpSpecification: IBusinessInfo;
  feedbackMechanism: IBusinessInfo;
  yourHook: IBusinessInfo;
  founderStory: IBusinessInfo;
  showcaseProblem: IBusinessInfo;
  gotoMarketStrategy: IBusinessInfo;
  progressMetrics: IBusinessInfo;
  unitEconomics: IBusinessInfo;
  opitmizePitch: IBusinessInfo;
  networkingStrategy: IBusinessInfo;
  outreachDM: IBusinessInfo;
  investorOutreachEmail: IBusinessInfo;
  painPointSearchPhrase: IBusinessInfo;
  socialDemand: IBusinessInfo;
  customerExperienceMap: IBusinessInfo;
  painPointOpportunity: IBusinessInfo;
  outlineDemandTest: IBusinessInfo;
  demandTestGoal: IBusinessInfo;
  interviewPipelineStrategy: IBusinessInfo;
  pipelineMessage: IBusinessInfo;
  supportingVisual: IBusinessInfo;
  targetUsersCommunity: IBusinessInfo;
  defineMarketingChannelStrategy: IBusinessInfo;
  developCallToAction: IBusinessInfo;
  updateStrategy: IBusinessInfo;
  updateCategories: IBusinessInfo;
  firstCompanyUpdate: IBusinessInfo;
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
