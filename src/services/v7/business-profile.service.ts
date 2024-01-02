import {
  BusinessProfileTable,
  ImpactTable,
  PassionTable,
  WeeklyJourneyResultTable,
} from "@app/model";
import { NetworkError } from "@app/middleware";
import { ObjectId } from "mongodb";

class BusinessProfileService {
  /**
   * @description add or update business profile
   * @param data
   * @param userProgress
   * @returns {*}
   */
  public async addOrEditBusinessProfile(data: any, userId: string) {
    try {
      let obj = {};
      obj[data.key] = data.value;
      await BusinessProfileTable.findOneAndUpdate(
        {
          userId: userId,
        },
        {
          $set: obj,
        },
        { upsert: true }
      );

      if (data.weeklyJourneyId) {
        const dataToCreate = {
          weeklyJourneyId: data.weeklyJourneyId,
          actionNum: data.actionNum,
          userId: userId,
          actionInput: data.key,
        };
        await WeeklyJourneyResultTable.create(dataToCreate);
      }
      return true;
    } catch (error) {
      throw new NetworkError("Something went wrong", 400);
    }
  }

  /**
   * @description get business profile
   */
  public async getBusinessProfile(id: string) {
    let businessProfile: any = await BusinessProfileTable.aggregate([
      {
        $match: {
          userId: new ObjectId(id),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userData",
        },
      },
      {
        $unwind: {
          path: "$userData",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $addFields: {
          allBusinessPlans: [
            {
              key: "description",
              type: "text",
              value: "$description",
              sectionTitle: "Business Description",
              sheetTitle: "Add your business decription",
            },
            {
              key: "companyName",
              type: "text",
              value: "$companyName",
              sectionTitle: "Company Name",
              sheetTitle: "Pro-tip: be unique but easy to spell and read.",
            },
            {
              key: "companyLogo",
              type: "image",
              value: "$companyLogo",
              sectionTitle: "Business Logo",
              sheetTitle:
                "Pro-tip: the most iconic logos are remarkably simple.",
            },
            {
              key: "targetAudience",
              type: "text",
              value: "$targetAudience",
              sectionTitle: "Target Audience",
              sheetTitle:
                "Pro-tip: be specific! Include age, wealth, activities and interests.",
            },
            {
              key: "competitors",
              type: "text",
              value: "$competitors",
              sectionTitle: "Top 5 Competitors",
              sheetTitle:
                "Pro-tip: choose both big companies and tiny startups.",
            },
            {
              key: "keyDifferentiator",
              type: "text",
              value: "$keyDifferentiator",
              sectionTitle: "Key Differentiator",
              sheetTitle:
                "Pro-tip: choose one, specific aspect of your product or your audience.",
            },
            {
              key: "xForY",
              type: "text",
              value: "$xForY",
              sectionTitle: "X For Y Pitch",
              sheetTitle:
                "Pro-tip: choose a company most people are likely to know.",
            },
            {
              key: "headline",
              type: "text",
              value: "$headline",
              sectionTitle: "Headline",
              sheetTitle:
                "Pro-tip: make it short (10 words or less) and catchy!",
            },
            {
              key: "valueCreators",
              type: "text",
              value: "$valueCreators",
              sectionTitle: "Top 3 Value Creators",
              sheetTitle: "Pro-tip: make each value creator than three words",
            },
            {
              key: "colorsAndAesthetic",
              type: "text",
              value: "$colorsAndAesthetic",
              sectionTitle: "Brand Colors & Aesthetic",
              sheetTitle:
                "Pro-tip: consider the specifics of your audience in choosing brand colors and aesthetic",
            },
            {
              key: "callToAction",
              type: "text",
              value: "$callToAction",
              sectionTitle: "Enter your call-to-action",
              sheetTitle:
                'Examples:\nApple iPhone: "Buy Now"\nAmazon Prime:"See Deals"\nOpenAI API: "Try ChatGPT Plus"',
            },
            {
              key: "linkYourBlog",
              type: "text",
              value: "$linkYourBlog",
              sectionTitle: "Link Your Blog",
              sheetTitle:
                'Pro-tip: "join waitlist" can be a very effective CTA before you launch your product',
            },
            {
              key: "linkYourWebsite",
              type: "text",
              value: "$linkYourWebsite",
              sectionTitle: "Link Your Website",
              sheetTitle:
                'Pro-tip: "join waitlist" can be a very effective CTA before you launch your product',
            },
            {
              key: "appName",
              type: "text",
              value: "$appName",
              sectionTitle: "Enter the app's name that inspires you",
              sheetTitle:
                "Pro-tip: your inspo app does not have to be a competitor",
            },
            {
              key: "homescreenImage",
              type: "image",
              value: "$homescreenImage",
              sectionTitle: "Upload picture of your homescreen/homepage",
              sheetTitle:
                "Pro-tip: don't start from scratch, find a great template to start from",
            },
            {
              key: "customerDiscovery",
              type: "text",
              value: "$customerDiscovery",
              sectionTitle: "Enter one takeaway based on customer discovery",
              sheetTitle:
                "Pro-tip: don't start from scratch, find a great template to start from",
            },
            {
              key: "socialFeedback",
              type: "image",
              value: "$socialFeedback",
              sectionTitle: "Upload picture of social feedback",
              sheetTitle:
                "Pro-tip: use Instagram, Tiktok or LinkedIn to aggregate votes, comments and likes that give you product insights",
            },
            {
              key: "productUpdate",
              type: "text",
              value: "$productUpdate",
              sectionTitle:
                "Define one product update from the feedback you received",
              sheetTitle:
                "Pro-tip: if you recieved multiple insights, decide what one change would have the most impact",
            },
            {
              key: "mvpHomeScreen",
              type: "text",
              value: "$mvpHomeScreen",
              sectionTitle: "Upload a picture of your MVP homescreen",
              sheetTitle:
                "Pro-tip: less is more, don't try to accomplish too much!",
            },
            {
              key: "socialMediaAccountLink",
              type: "text",
              value: "$socialMediaAccountLink",
              sectionTitle:
                "Add link to social media account on TikTok, Instagram, LinkedIn, etc",
              sheetTitle:
                "Pro-tip: choose ONLY ONE social media platform where you think you can win the most attention of your target audience",
            },
            {
              key: "firstPostLink",
              type: "text",
              value: "$firstPostLink",
              sectionTitle:
                "Add link to your first post on TikTok, Instagram, LinkedIn, etc",
              sheetTitle:
                "Pro-tip: write a post that gives helpful information about the problem you are solving",
            },
            {
              key: "favoriteComment",
              type: "text",
              value: "$favoriteComment",
              sectionTitle: "Enter your favorite comment on your post",
              sheetTitle:
                "Pro-tip: on social, giving in the form of likes, comments and shares = long-term equity",
            },
            {
              key: "aspiringSocialAccount",
              type: "text",
              value: "$aspiringSocialAccount",
              sectionTitle:
                "Link one of the social media accounts that you aspire to be like, and has a similar audience",
              sheetTitle:
                "Pro-tip: on social, giving in the form of likes, comments and shares = long-term equity",
            },
            {
              key: "socialCampaignTheme",
              type: "text",
              value: "$socialCampaignTheme",
              sectionTitle: "Enter the theme of your social media campaigne",
              sheetTitle:
                "Pro-tip: social media campaigns are a series of posts with a similar theme of how they help or entertain a user",
            },
            {
              key: "firstSocialCampaign",
              type: "text",
              value: "$firstSocialCampaign",
              sectionTitle: "Link the post of your first social campaign",
              sheetTitle:
                "Pro-tip: send your post over text, email or other mediums to family and friends so you can get the view count up!",
            },
          ],
        },
      },
      {
        $addFields: {
          filteredBusinessPlans: {
            $filter: {
              input: "$allBusinessPlans",
              as: "plan",
              cond: {
                $and: [
                  { $ne: ["$$plan.value", null] },
                  { $ne: ["$$plan.value", undefined] },
                  { $ne: [{ $type: "$$plan.value" }, "missing"] },
                ],
              },
            },
          },
        },
      },
      {
        $project: {
          _id: "$_id",
          userId: "$userId",
          impacts: 1,
          passions: 1,
          businessPlans: "$filteredBusinessPlans",
        },
      },
    ]).exec();
    return businessProfile?.[0] ?? null;
  }
}
export default new BusinessProfileService();
