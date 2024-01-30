import {
  BusinessProfileTable,
  WeeklyJourneyResultTable,
  BusinessPassionTable,
  BusinessPassionAspectTable,
  UserTable,
} from "@app/model";
import { NetworkError } from "@app/middleware";
import { ObjectId } from "mongodb";
import { UserService } from "@app/services/v7";
import envData from "@app/config";
import OpenAI from "openai";
import {
  SYSTEM,
  USER,
  BUSINESS_PREFERENCE,
  INVALID_DESCRIPTION_ERROR,
  ANALYTICS_EVENTS,
  MAXIMIZE_BUSINESS_IMAGES,
  SYSTEM_INPUT,
  BUSINESS_ACTIONS,
  generateImage,
  UpscaleImage,
  IMAGE_ACTIONS,
  SUGGESTION_FORMAT,
  IS_RETRY,
} from "@app/utility";
import { AnalyticsService } from "@app/services/v4";

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
      // when user is onboarded, 'businessIdeaInfo' key will be sent to store business-description and opportunity highlight
      if (data.businessIdeaInfo) {
        obj[data.businessIdeaInfo[0].key] = data.businessIdeaInfo[0].value;
        obj[data.businessIdeaInfo[1].key] = data.businessIdeaInfo[1].value;
        AnalyticsService.sendEvent(
          ANALYTICS_EVENTS.BUSINESS_IDEA_SELECTED,
          {
            "Item Name": data.businessIdeaInfo[0].value,
          },
          {
            user_id: userIfExists._id,
          }
        );
      } else {
        obj[data.key] = data.value;
        obj["isRetry"] = false;
      }
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
              actionType: "text",
              value: "$description",
              title: "Business Description",
              description: "Add your business decription",
              actionName: "Your Business Description",
              placeHolderText:
                "Example: Be the go-to platform for all emerging entrepreneurs to start their businesses.",
              isMultiLine: true,
              maxCharLimit: 15,
            },
            {
              key: "companyName",
              actionType: "text",
              value: "$companyName",
              title: "Company Name",
              description: "Pro-tip: be unique but easy to spell and read.",
              actionName: "Your Business Name",
              placeHolderText: "Enter name...",
              isMultiLine: false,
              maxCharLimit: 0,
            },
            {
              key: "companyLogo",
              actionType: "image",
              value: "$companyLogo",
              title: "Business Logo",
              description:
                "Pro-tip: the most iconic logos are remarkably simple.",
              actionName: "Your Logo",
              placeHolderText: null,
              isMultiLine: false,
              maxCharLimit: 280,
            },
            {
              key: "targetAudience",
              actionType: "text",
              value: "$targetAudience",
              title: "Target Audience",
              description:
                "Pro-tip: be specific! Include age, wealth, activities and interests.",
              actionName: "Select Your Target Audience",
              placeHolderText: "Enter description...",
              isMultiLine: true,
              maxCharLimit: 280,
            },
            {
              key: "competitors",
              actionType: "text",
              value: "$competitors",
              title: "Top 5 Competitors",
              description:
                "Pro-tip: choose both big companies and tiny startups.",
              actionName: "Your Top-5 Competitors",
              placeHolderText: "Enter description...",
              isMultiLine: true,
              maxCharLimit: 280,
            },
            {
              key: "keyDifferentiator",
              actionType: "text",
              value: "$keyDifferentiator",
              title: "Key Differentiator",
              description:
                "Pro-tip: choose one, specific aspect of your product or your audience.",
              actionName: "Your Key Differentiator",
              placeHolderText: "Enter description...",
              isMultiLine: true,
              maxCharLimit: 280,
            },
            {
              key: "xForY",
              actionType: "text",
              value: "$xForY",
              title: "X For Y Pitch",
              description:
                "Pro-tip: choose a company most people are likely to know.",
              actionName: "Your X For Y Pitch",
              placeHolderText: "Enter description...",
              isMultiLine: false,
              maxCharLimit: 40,
            },
            {
              key: "headline",
              actionType: "text",
              value: "$headline",
              title: "Headline",
              description:
                "Pro-tip: make it short (10 words or less) and catchy!",
              placeHolderText: "Enter description...",
              isMultiLine: true,
              maxCharLimit: 280,
            },
            {
              key: "valueCreators",
              actionType: "text",
              value: "$valueCreators",
              title: "Top 3 Value Creators",
              description: "Pro-tip: make each value creator than three words",
              placeHolderText: "Enter description...",
              isMultiLine: true,
              maxCharLimit: 280,
            },
            {
              key: "colorsAndAesthetic",
              actionType: "text",
              value: "$colorsAndAesthetic",
              title: "Brand Colors & Aesthetic",
              description:
                "Pro-tip: consider the specifics of your audience in choosing brand colors and aesthetic",
              placeHolderText: "Enter description...",
              isMultiLine: true,
              maxCharLimit: 280,
            },
            {
              key: "callToAction",
              actionType: "text",
              value: "$callToAction",
              title: "Enter your call-to-action",
              description:
                'Examples:\nApple iPhone: "Buy Now"\nAmazon Prime:"See Deals"\nOpenAI API: "Try ChatGPT Plus"',
              placeHolderText: "Enter description...",
              isMultiLine: true,
              maxCharLimit: 280,
            },
            {
              key: "linkYourBlog",
              actionType: "text",
              value: "$linkYourBlog",
              title: "Link Your Blog",
              description:
                'Pro-tip: "join waitlist" can be a very effective CTA before you launch your product',
              placeHolderText: "Enter description...",
            },
            {
              key: "linkYourWebsite",
              actionType: "text",
              value: "$linkYourWebsite",
              title: "Link Your Website",
              description:
                'Pro-tip: "join waitlist" can be a very effective CTA before you launch your product',
              placeHolderText: "Enter description...",
              isMultiLine: false,
              maxCharLimit: 280,
            },
            {
              key: "appName",
              actionType: "text",
              value: "$appName",
              title: "Enter the app's name that inspires you",
              description:
                "Pro-tip: your inspo app does not have to be a competitor",
              placeHolderText: "Enter description...",
              isMultiLine: false,
              maxCharLimit: 280,
            },
            {
              key: "homescreenImage",
              actionType: "image",
              value: "$homescreenImage",
              title: "Upload picture of your homescreen/homepage",
              description:
                "Pro-tip: don't start from scratch, find a great template to start from",
              placeHolderText: "Enter description...",
              isMultiLine: false,
              maxCharLimit: 280,
            },
            {
              key: "customerDiscovery",
              actionType: "text",
              value: "$customerDiscovery",
              title: "Enter one takeaway based on customer discovery",
              description:
                "Pro-tip: don't start from scratch, find a great template to start from",
              placeHolderText: "Enter description...",
              isMultiLine: false,
              maxCharLimit: 280,
            },
            {
              key: "socialFeedback",
              actionType: "image",
              value: "$socialFeedback",
              title: "Upload picture of social feedback",
              description:
                "Pro-tip: use Instagram, Tiktok or LinkedIn to aggregate votes, comments and likes that give you product insights",
              placeHolderText: "Enter description...",
              isMultiLine: false,
              maxCharLimit: 280,
            },
            {
              key: "productUpdate",
              actionType: "text",
              value: "$productUpdate",
              title: "Define one product update from the feedback you received",
              description:
                "Pro-tip: if you recieved multiple insights, decide what one change would have the most impact",
              placeHolderText: "Enter description...",
              isMultiLine: false,
              maxCharLimit: 280,
            },
            {
              key: "mvpHomeScreen",
              actionType: "image",
              value: "$mvpHomeScreen",
              title: "Upload a picture of your MVP homescreen",
              description:
                "Pro-tip: less is more, don't try to accomplish too much!",
              placeHolderText: "Enter description...",
              isMultiLine: false,
              maxCharLimit: 280,
            },
            {
              key: "socialMediaAccountLink",
              actionType: "text",
              value: "$socialMediaAccountLink",
              title:
                "Add link to social media account on TikTok, Instagram, LinkedIn, etc",
              description:
                "Pro-tip: choose ONLY ONE social media platform where you think you can win the most attention of your target audience",
              placeHolderText: "Enter description...",
              isMultiLine: false,
              maxCharLimit: 280,
            },
            {
              key: "firstPostLink",
              actionType: "text",
              value: "$firstPostLink",
              title:
                "Add link to your first post on TikTok, Instagram, LinkedIn, etc",
              description:
                "Pro-tip: write a post that gives helpful information about the problem you are solving",
              placeHolderText: "Enter description...",
              isMultiLine: false,
              maxCharLimit: 280,
            },
            {
              key: "favoriteComment",
              actionType: "text",
              value: "$favoriteComment",
              title: "Enter your favorite comment on your post",
              description:
                "Pro-tip: on social, giving in the form of likes, comments and shares = long-term equity",
              placeHolderText: "Enter description...",
              isMultiLine: false,
              maxCharLimit: 280,
            },
            {
              key: "aspiringSocialAccount",
              actionType: "text",
              value: "$aspiringSocialAccount",
              title:
                "Link one of the social media accounts that you aspire to be like, and has a similar audience",
              description:
                "Pro-tip: on social, giving in the form of likes, comments and shares = long-term equity",
              placeHolderText: "Enter description...",
              isMultiLine: false,
              maxCharLimit: 280,
            },
            {
              key: "socialCampaignTheme",
              actionType: "text",
              value: "$socialCampaignTheme",
              title: "Enter the theme of your social media campaigne",
              description:
                "Pro-tip: social media campaigns are a series of posts with a similar theme of how they help or entertain a user",
              placeHolderText: "Enter description...",
              isMultiLine: false,
              maxCharLimit: 280,
            },
            {
              key: "firstSocialCampaign",
              actionType: "text",
              value: "$firstSocialCampaign",
              title: "Link the post of your first social campaign",
              description:
                "Pro-tip: send your post over text, email or other mediums to family and friends so you can get the view count up!",
              placeHolderText: "Enter description...",
              isMultiLine: false,
              maxCharLimit: 280,
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

  /**
   * @description this will generate business idea using OpenAI GPT
   * @param data
   * @returns {*}
   */
  public async generateBusinessIdea(
    systemInput: string,
    prompt: string,
    passion: string
  ) {
    try {
      let [response, businessPassionImages] = await Promise.all([
        this.generateTextSuggestions(systemInput, prompt),
        BusinessPassionTable.find({ title: passion }),
      ]);

      if (
        !response.choices[0].message.content.includes("businessDescription") ||
        !response.choices[0].message.content.includes("opportunityHighlight")
      ) {
        throw new NetworkError(INVALID_DESCRIPTION_ERROR, 400);
      }

      let newResponse = JSON.parse(response.choices[0].message.content);
      if (!businessPassionImages.length) {
        newResponse.map(
          (idea, idx) => (idea["image"] = MAXIMIZE_BUSINESS_IMAGES[idx])
        );
      } else {
        newResponse.map(
          (idea, idx) =>
            (idea["image"] = businessPassionImages[0].businessImages[idx])
        );
      }
      return newResponse;
    } catch (error) {
      if (error.message == INVALID_DESCRIPTION_ERROR) {
        throw new NetworkError(INVALID_DESCRIPTION_ERROR, 400);
      }
      throw new NetworkError(
        "Error Occured while generating Business Idea",
        400
      );
    }
  }

  /**
   * @description this will return array of passions/aspect/problems
   * @param data
   * @returns {*}
   */
  public async getBusinessPreference(data: any) {
    try {
      let response = [];
      if (data.key == BUSINESS_PREFERENCE.PASSION) {
        response = await BusinessPassionTable.find({})
          .select("image title")
          .sort({ order: 1 });
      } else if (data.key == BUSINESS_PREFERENCE.ASPECT) {
        const aspectsData = await BusinessPassionAspectTable.find({
          businessPassionId: data._id,
        }).select("aspect aspectImage");
        response = aspectsData.map((aspect) => ({
          _id: aspect._id,
          title: aspect.aspect,
          image: aspect.aspectImage,
        }));
      } else if (data.key == BUSINESS_PREFERENCE.PROBLEM) {
        let order = 0;
        const problemsData = await BusinessPassionAspectTable.find({
          _id: data._id,
        }).select("problems");
        problemsData[0].problems.map((problem) => {
          response.push({
            _id: ++order,
            title: problem,
            image: null,
          });
        });
      }
      return response;
    } catch (error) {
      throw new NetworkError("Something Went Wrong", 400);
    }
  }

  /**
   * @description this will generate business idea using OpenAI GPT
   * @param data
   * @returns {*}
   */
  public async generateAISuggestions(
    userExists: any,
    key: string,
    userBusinessProfile: any,
    actionInput: string,
    isRetry: any = false
  ) {
    try {
      let response = null;
      if (userBusinessProfile.isRetry == false || isRetry == IS_RETRY.TRUE) {
        let prompt = null;
        if (IMAGE_ACTIONS.includes(key)) {
          prompt = `Business Name:${
            userBusinessProfile.companyName
          }, Business Description: ${userBusinessProfile.description} ${
            SYSTEM_INPUT[BUSINESS_ACTIONS[key]]
          }`;
        } else {
          prompt = userBusinessProfile.description;
        }
        if (actionInput == SUGGESTION_FORMAT.TEXT) {
          response = await this.generateTextSuggestions(
            SYSTEM_INPUT[BUSINESS_ACTIONS[key]],
            prompt
          );
          response = JSON.parse(response.choices[0].message.content);
        } else {
          const imagePrompt = await this.generateTextSuggestions(
            SYSTEM_INPUT[BUSINESS_ACTIONS[key]],
            prompt
          );
          const response1 = await this.generateImageSuggestions(
            imagePrompt.choices[0].message.content
          );
          response = [...response1];
        }
        if (response && isRetry == IS_RETRY.TRUE) {
          await UserTable.findOneAndUpdate(
            { _id: userExists._id },
            {
              $inc: {
                quizCoins: -200,
              },
            }
          );
        } else {
          await BusinessProfileTable.findOneAndUpdate(
            { userId: userExists._id },
            {
              $set: {
                aiGeneratedSuggestions: response,
                isRetry: true,
              },
            }
          );
        }
        return { suggestions: response, isRetry: true };
      }
      return {
        suggestions: userBusinessProfile.aiGeneratedSuggestions,
        isRetry: true,
      };
    } catch (error) {
      if (error.message == INVALID_DESCRIPTION_ERROR) {
        throw new NetworkError(INVALID_DESCRIPTION_ERROR, 400);
      }
      throw new NetworkError(
        "Error Occured while generating suggestions : " + error.message,
        400
      );
    }
  }

  /**
   * @description this will generate suggestions using OpenAI API based on user inputs
   * @param data
   * @returns {*}
   */
  public async generateTextSuggestions(systemInput: string, prompt: string) {
    try {
      const openai = new OpenAI({
        apiKey: envData.OPENAI_API_KEY,
      });

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: SYSTEM,
            content: systemInput,
          },
          {
            role: USER,
            content: prompt,
          },
        ],
        temperature: 1,
        max_tokens: 256,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      });
      return response;
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }

  /**
   * @description this will generate suggestions using OpenAI API based on user inputs
   * @param data
   * @returns {*}
   */
  public async generateImageSuggestions(prompt: string) {
    try {
      const imagineRes = await generateImage(prompt);
      if (!imagineRes) {
        throw new NetworkError("Something Went Wrong in myImage", 400);
      }
      const imageData1 = await UpscaleImage(imagineRes, 1);
      const imageData2 = await UpscaleImage(imagineRes, 2);
      const imageData3 = await UpscaleImage(imagineRes, 3);
      const imageData4 = await UpscaleImage(imagineRes, 4);
      return [imageData1.uri, imageData2.uri, imageData3.uri, imageData4.uri];
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }
}
export default new BusinessProfileService();
