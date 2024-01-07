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
  companyName: string;
  companyLogo: string;
  targetAudience: string;
  competitors: string;
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
}
