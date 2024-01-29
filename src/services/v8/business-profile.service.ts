import { BusinessProfileTable } from "@app/model";
import { ObjectId } from "mongodb";

class BusinessProfileService {
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
              title: "Creating Your\nPerfect Business",
              description: "Add your business decription",
              actionName: "Your Business Description",
              actionType: "text",
              placeHolderText:
                "Example: Be the go-to platform for all emerging entrepreneurs to start their businesses.",
            },
            {
              key: "companyName",
              type: "text",
              value: "$companyName",
              title: "Creating Your Business Name",
              actionName: "Your Business Name",
              actionType: "text",
              description: "Pro-tip: be unique but easy to spell and read.",
              placeHolderText: "Enter name...",
            },
            {
              key: "companyLogo",
              type: "image",
              value: "$companyLogo",
              title: "Creating Your Logo",
              actionName: "Your Logo",
              actionType: "image",
              description:
                "Pro-tip: the most iconic logos are remarkably simple.",
              placeHolderText: null,
            },
            {
              key: "targetAudience",
              type: "text",
              value: "$targetAudience",
              title: "Creating Your Target Audience",
              actionName: "Select Your Target Audience",
              actionType: "text",
              description:
                "Pro-tip: be specific! Include age, wealth, activities and interests.",
              placeHolderText: "Enter description...",
            },
            {
              key: "competitors",
              type: "text",
              value: "$competitors",
              title: "Top 5 Competitors",
              actionName: "Your Top-5 Competitors",
              actionType: "text",
              description:
                "Pro-tip: choose both big companies and tiny startups.",
              placeHolderText: "Enter description...",
            },
            {
              key: "keyDifferentiator",
              type: "text",
              value: "$keyDifferentiator",
              title: "Key Differentiator",
              actionName: "Your Key Differentiator",
              actionType: "text",
              description:
                "Pro-tip: choose one, specific aspect of your product or your audience.",
              placeHolderText: "Enter description...",
            },
            {
              key: "xForY",
              type: "text",
              value: "$xForY",
              title: "X For Y Pitch",
              actionName: "Your X For Y Pitch",
              actionType: "text",
              description:
                "Pro-tip: choose a company most people are likely to know.",
              placeHolderText: "Enter description...",
            },
            {
              key: "headline",
              type: "text",
              value: "$headline",
              title: "Headline",
              actionType: "text",
              description:
                "Pro-tip: make it short (10 words or less) and catchy!",
              placeHolderText: "Enter description...",
            },
            {
              key: "valueCreators",
              type: "text",
              value: "$valueCreators",
              title: "Top 3 Value Creators",
              actionType: "text",
              description: "Pro-tip: make each value creator than three words",
              placeHolderText: "Enter description...",
            },
            {
              key: "colorsAndAesthetic",
              type: "text",
              value: "$colorsAndAesthetic",
              title: "Brand Colors & Aesthetic",
              actionType: "text",
              description:
                "Pro-tip: consider the specifics of your audience in choosing brand colors and aesthetic",
              placeHolderText: "Enter description...",
            },
            {
              key: "callToAction",
              type: "text",
              value: "$callToAction",
              title: "Enter your call-to-action",
              actionType: "text",
              description:
                'Examples:\nApple iPhone: "Buy Now"\nAmazon Prime:"See Deals"\nOpenAI API: "Try ChatGPT Plus"',
              placeHolderText: "Enter description...",
            },
            {
              key: "linkYourBlog",
              type: "text",
              value: "$linkYourBlog",
              title: "Link Your Blog",
              actionType: "text",
              description:
                'Pro-tip: "join waitlist" can be a very effective CTA before you launch your product',
              placeHolderText: "Enter description...",
            },
            {
              key: "linkYourWebsite",
              type: "text",
              value: "$linkYourWebsite",
              title: "Link Your Website",
              actionType: "text",
              description:
                'Pro-tip: "join waitlist" can be a very effective CTA before you launch your product',
              placeHolderText: "Enter description...",
            },
            {
              key: "appName",
              type: "text",
              value: "$appName",
              title: "Enter the app's name that inspires you",
              actionType: "text",
              description:
                "Pro-tip: your inspo app does not have to be a competitor",
              placeHolderText: "Enter name...",
            },
            {
              key: "homescreenImage",
              type: "image",
              value: "$homescreenImage",
              title: "Upload picture of your homescreen/homepage",
              actionType: "image",
              description:
                "Pro-tip: don't start from scratch, find a great template to start from",
              placeHolderText: "Enter description...",
            },
            {
              key: "customerDiscovery",
              type: "text",
              value: "$customerDiscovery",
              title: "Enter one takeaway based on customer discovery",
              actionType: "text",
              description:
                "Pro-tip: don't start from scratch, find a great template to start from",
              placeHolderText: "Enter description...",
            },
            {
              key: "socialFeedback",
              type: "image",
              value: "$socialFeedback",
              title: "Upload picture of social feedback",
              actionType: "text",
              description:
                "Pro-tip: use Instagram, Tiktok or LinkedIn to aggregate votes, comments and likes that give you product insights",
              placeHolderText: "Enter description...",
            },
            {
              key: "productUpdate",
              type: "text",
              value: "$productUpdate",
              title: "Define one product update from the feedback you received",
              actionType: "text",
              description:
                "Pro-tip: if you recieved multiple insights, decide what one change would have the most impact",
              placeHolderText: "Enter description...",
            },
            {
              key: "mvpHomeScreen",
              type: "image",
              value: "$mvpHomeScreen",
              title: "Upload a picture of your MVP homescreen",
              actionType: "image",
              description:
                "Pro-tip: less is more, don't try to accomplish too much!",
              placeHolderText: "Enter description...",
            },
            {
              key: "socialMediaAccountLink",
              type: "text",
              value: "$socialMediaAccountLink",
              title:
                "Add link to social media account on TikTok, Instagram, LinkedIn, etc",
              actionType: "text",
              description:
                "Pro-tip: choose ONLY ONE social media platform where you think you can win the most attention of your target audience",
              placeHolderText: "Enter description...",
            },
            {
              key: "firstPostLink",
              type: "text",
              value: "$firstPostLink",
              title:
                "Add link to your first post on TikTok, Instagram, LinkedIn, etc",
              actionType: "text",
              description:
                "Pro-tip: write a post that gives helpful information about the problem you are solving",
              placeHolderText: "Enter description...",
            },
            {
              key: "favoriteComment",
              type: "text",
              value: "$favoriteComment",
              title: "Enter your favorite comment on your post",
              actionType: "text",
              description:
                "Pro-tip: on social, giving in the form of likes, comments and shares = long-term equity",
              placeHolderText: "Enter description...",
            },
            {
              key: "aspiringSocialAccount",
              type: "text",
              value: "$aspiringSocialAccount",
              title:
                "Link one of the social media accounts that you aspire to be like, and has a similar audience",
              actionType: "text",
              description:
                "Pro-tip: on social, giving in the form of likes, comments and shares = long-term equity",
              placeHolderText: "Enter description...",
            },
            {
              key: "socialCampaignTheme",
              type: "text",
              value: "$socialCampaignTheme",
              title: "Enter the theme of your social media campaigne",
              actionType: "text",
              description:
                "Pro-tip: social media campaigns are a series of posts with a similar theme of how they help or entertain a user",
              placeHolderText: "Enter description...",
            },
            {
              key: "firstSocialCampaign",
              type: "text",
              value: "$firstSocialCampaign",
              title: "Link the post of your first social campaign",
              actionType: "text",
              description:
                "Pro-tip: send your post over text, email or other mediums to family and friends so you can get the view count up!",
              placeHolderText: "Enter description...",
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
          hoursSaved: 1,
        },
      },
    ]).exec();
    return businessProfile?.[0] ?? null;
  }
}
export default new BusinessProfileService();
