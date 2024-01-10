import {
  BusinessProfileTable,
  WeeklyJourneyResultTable,
  UserTable,
} from "@app/model";
import { NetworkError } from "@app/middleware";
import { ObjectId } from "mongodb";
import { UserService } from "@app/services/v7";

class BusinessProfileService {
  /**
   * @description add or update business profile
   * @param data
   * @param userProgress
   * @returns {*}
   */
  public async addOrEditBusinessProfile(data: any, userIfExists: any) {
    try {
      let obj = {};
      obj[data.key] = data.value;
      await BusinessProfileTable.findOneAndUpdate(
        {
          userId: userIfExists._id,
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
          userId: userIfExists._id,
          actionInput: data.key,
        };
        await WeeklyJourneyResultTable.create(dataToCreate);

        UserService.updateUserScore(userIfExists, data);
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
              title: "Business Description",
              description: "Add your business decription",
            },
            {
              key: "companyName",
              type: "text",
              value: "$companyName",
              title: "Company Name",
              description: "Pro-tip: be unique but easy to spell and read.",
            },
            {
              key: "companyLogo",
              type: "image",
              value: "$companyLogo",
              title: "Business Logo",
              description:
                "Pro-tip: the most iconic logos are remarkably simple.",
            },
            {
              key: "targetAudience",
              type: "text",
              value: "$targetAudience",
              title: "Target Audience",
              description:
                "Pro-tip: be specific! Include age, wealth, activities and interests.",
            },
            {
              key: "competitors",
              type: "text",
              value: "$competitors",
              title: "Top 5 Competitors",
              description:
                "Pro-tip: choose both big companies and tiny startups.",
            },
            {
              key: "keyDifferentiator",
              type: "text",
              value: "$keyDifferentiator",
              title: "Key Differentiator",
              description:
                "Pro-tip: choose one, specific aspect of your product or your audience.",
            },
            {
              key: "xForY",
              type: "text",
              value: "$xForY",
              title: "X For Y Pitch",
              description:
                "Pro-tip: choose a company most people are likely to know.",
            },
            {
              key: "headline",
              type: "text",
              value: "$headline",
              title: "Headline",
              description:
                "Pro-tip: make it short (10 words or less) and catchy!",
            },
            {
              key: "valueCreators",
              type: "text",
              value: "$valueCreators",
              title: "Top 3 Value Creators",
              description: "Pro-tip: make each value creator than three words",
            },
            {
              key: "colorsAndAesthetic",
              type: "text",
              value: "$colorsAndAesthetic",
              title: "Brand Colors & Aesthetic",
              description:
                "Pro-tip: consider the specifics of your audience in choosing brand colors and aesthetic",
            },
            {
              key: "callToAction",
              type: "text",
              value: "$callToAction",
              title: "Enter your call-to-action",
              description:
                'Examples:\nApple iPhone: "Buy Now"\nAmazon Prime:"See Deals"\nOpenAI API: "Try ChatGPT Plus"',
            },
            {
              key: "linkYourBlog",
              type: "text",
              value: "$linkYourBlog",
              title: "Link Your Blog",
              description:
                'Pro-tip: "join waitlist" can be a very effective CTA before you launch your product',
            },
            {
              key: "linkYourWebsite",
              type: "text",
              value: "$linkYourWebsite",
              title: "Link Your Website",
              description:
                'Pro-tip: "join waitlist" can be a very effective CTA before you launch your product',
            },
            {
              key: "appName",
              type: "text",
              value: "$appName",
              title: "Enter the app's name that inspires you",
              description:
                "Pro-tip: your inspo app does not have to be a competitor",
            },
            {
              key: "homescreenImage",
              type: "image",
              value: "$homescreenImage",
              title: "Upload picture of your homescreen/homepage",
              description:
                "Pro-tip: don't start from scratch, find a great template to start from",
            },
            {
              key: "customerDiscovery",
              type: "text",
              value: "$customerDiscovery",
              title: "Enter one takeaway based on customer discovery",
              description:
                "Pro-tip: don't start from scratch, find a great template to start from",
            },
            {
              key: "socialFeedback",
              type: "image",
              value: "$socialFeedback",
              title: "Upload picture of social feedback",
              description:
                "Pro-tip: use Instagram, Tiktok or LinkedIn to aggregate votes, comments and likes that give you product insights",
            },
            {
              key: "productUpdate",
              type: "text",
              value: "$productUpdate",
              title: "Define one product update from the feedback you received",
              description:
                "Pro-tip: if you recieved multiple insights, decide what one change would have the most impact",
            },
            {
              key: "mvpHomeScreen",
              type: "image",
              value: "$mvpHomeScreen",
              title: "Upload a picture of your MVP homescreen",
              description:
                "Pro-tip: less is more, don't try to accomplish too much!",
            },
            {
              key: "socialMediaAccountLink",
              type: "text",
              value: "$socialMediaAccountLink",
              title:
                "Add link to social media account on TikTok, Instagram, LinkedIn, etc",
              description:
                "Pro-tip: choose ONLY ONE social media platform where you think you can win the most attention of your target audience",
            },
            {
              key: "firstPostLink",
              type: "text",
              value: "$firstPostLink",
              title:
                "Add link to your first post on TikTok, Instagram, LinkedIn, etc",
              description:
                "Pro-tip: write a post that gives helpful information about the problem you are solving",
            },
            {
              key: "favoriteComment",
              type: "text",
              value: "$favoriteComment",
              title: "Enter your favorite comment on your post",
              description:
                "Pro-tip: on social, giving in the form of likes, comments and shares = long-term equity",
            },
            {
              key: "aspiringSocialAccount",
              type: "text",
              value: "$aspiringSocialAccount",
              title:
                "Link one of the social media accounts that you aspire to be like, and has a similar audience",
              description:
                "Pro-tip: on social, giving in the form of likes, comments and shares = long-term equity",
            },
            {
              key: "socialCampaignTheme",
              type: "text",
              value: "$socialCampaignTheme",
              title: "Enter the theme of your social media campaigne",
              description:
                "Pro-tip: social media campaigns are a series of posts with a similar theme of how they help or entertain a user",
            },
            {
              key: "firstSocialCampaign",
              type: "text",
              value: "$firstSocialCampaign",
              title: "Link the post of your first social campaign",
              description:
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

  /**
   * @description this will generate business idea using OpenAI GPT
   * @param data
   * @returns {*}
   */
  public async generateBusinessIdea(data: any) {
    try {
      const businessIdeaGenerated = {
        description: data.passion,
        marketOpportunity: data.problem,
      };
      return businessIdeaGenerated;
    } catch (error) {
      throw new NetworkError("Something went wrong", 400);
    }
  }
}
export default new BusinessProfileService();
