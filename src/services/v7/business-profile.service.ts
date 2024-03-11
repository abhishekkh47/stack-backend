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
  DEDUCT_RETRY_FUEL,
  HOURS_SAVED_BY_IDEA_GENERATOR,
  delay,
  REQUIRE_COMPANY_NAME,
  BACKUP_LOGOS,
} from "@app/utility";
import { AnalyticsService } from "@app/services/v4";
import moment from "moment";

class BusinessProfileService {
  /**
   * @description add or update business profile
   * @param data
   * @param userProgress
   * @returns {*}
   */
  public async addOrEditBusinessProfile(
    data: any,
    userIfExists: any,
    actionScreenData: any
  ) {
    try {
      let obj = {};
      // when user is onboarded, 'businessIdeaInfo' key will be sent to store business-description and opportunity highlight
      const businessProfileData = await BusinessProfileTable.findOne({
        userId: userIfExists._id,
      });
      if (data.businessIdeaInfo) {
        obj[data.businessIdeaInfo[0].key] = data.businessIdeaInfo[0].value;
        obj[data.businessIdeaInfo[1].key] = data.businessIdeaInfo[1].value;
        if (!businessProfileData) {
          obj["hoursSaved"] = HOURS_SAVED_BY_IDEA_GENERATOR;
        }
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
        const getHoursSaved = actionScreenData.filter(
          (action) => action?.key == data.key
        );
        obj[data.key] = data.value;
        obj["isRetry"] = false;
        obj["aiGeneratedSuggestions"] = null;
        if (!businessProfileData[data.key] && getHoursSaved.length) {
          obj["hoursSaved"] =
            businessProfileData.hoursSaved + getHoursSaved[0].hoursSaved;
        }
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
      return [
        {
          ...obj,
          Business_Idea: obj["description"],
          Account_Name: userIfExists.firstName + " " + userIfExists.lastName,
          Email: userIfExists.email,
        },
      ];
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
              actionName: "Your Business Description",
              placeHolderText:
                "Example: Be the go-to platform for all emerging entrepreneurs to start their businesses.",
              isMultiLine: true,
              maxCharLimit: 280,
            },
            {
              key: "companyName",
              type: "text",
              value: "$companyName",
              title: "Company Name",
              description: "Pro-tip: be unique but easy to spell and read.",
              actionName: "Your Business Name",
              placeHolderText: "Enter name...",
              isMultiLine: false,
              maxCharLimit: 15,
            },
            {
              key: "companyLogo",
              type: "image",
              value: "$companyLogo",
              title: "Business Logo",
              description:
                "Pro-tip: the most iconic logos are remarkably simple.",
              actionName: "Your Logo",
              placeHolderText: null,
              isMultiLine: false,
              maxCharLimit: 0,
            },
            {
              key: "targetAudience",
              type: "text",
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
              type: "text",
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
              type: "text",
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
              type: "text",
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
              type: "text",
              value: "$headline",
              title: "Headline",
              description:
                "Pro-tip: make it short (10 words or less) and catchy!",
              actionName: "Your Headline",
              placeHolderText: "Enter description...",
              isMultiLine: false,
              maxCharLimit: 280,
            },
            {
              key: "valueCreators",
              type: "text",
              value: "$valueCreators",
              title: "Top 3 Value Creators",
              description:
                "Pro-tip: make each value creator less than three words",
              actionName: "Your Top 3 Value Creators",
              placeHolderText: "Enter description...",
              isMultiLine: true,
              maxCharLimit: 280,
            },
            {
              key: "colorsAndAesthetic",
              type: "text",
              value: "$colorsAndAesthetic",
              title: "Brand Colors & Aesthetic",
              description:
                "Pro-tip: consider the specifics of your audience in choosing brand colors and aesthetic",
              actionName: "Your Brand Colors & Aesthetic",
              placeHolderText: "Enter description...",
              isMultiLine: true,
              maxCharLimit: 280,
            },
            {
              key: "callToAction",
              type: "text",
              value: "$callToAction",
              title: "Call-to-Action",
              description:
                'Examples:\nApple iPhone: "Buy Now"\nAmazon Prime:"See Deals"\nOpenAI API: "Try ChatGPT Plus"',
              actionName: "Your Call-To-Action",
              placeHolderText: "Enter description...",
              isMultiLine: false,
              maxCharLimit: 40,
            },
            {
              key: "linkYourBlog",
              type: "text",
              value: "$linkYourBlog",
              title: "Blog Post Topic",
              description:
                "Pro-tip: Write about common question and concerns related to your industry",
              actionName: "Your Blog Post Topic",
              placeHolderText: "Enter description...",
              isMultiLine: true,
              maxCharLimit: 280,
            },
            {
              key: "linkYourWebsite",
              type: "text",
              value: "$linkYourWebsite",
              title: "Website Link",
              description:
                "Pro-tip: A good domain name is short, easy to spell and reflective of your brand name",
              actionName: "Your Website Link",
              placeHolderText: "Enter description...",
              isMultiLine: false,
              maxCharLimit: 40,
            },
            {
              key: "appName",
              type: "text",
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
              type: "image",
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
              type: "text",
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
              type: "image",
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
              type: "text",
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
              type: "image",
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
              type: "text",
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
              type: "text",
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
              type: "text",
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
              type: "text",
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
              type: "text",
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
              type: "text",
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
    passion: string,
    userExists: any,
    isRetry: string
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
      if (newResponse && isRetry == IS_RETRY.TRUE) {
        await UserTable.findOneAndUpdate(
          { _id: userExists._id },
          {
            $inc: {
              quizCoins: DEDUCT_RETRY_FUEL,
            },
          }
        );
      }
      return newResponse;
    } catch (error) {
      throw new NetworkError(INVALID_DESCRIPTION_ERROR, 400);
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
   * @param userExists
   * @param key
   * @param userBusinessProfile
   * @param isRetry
   * @returns {*}
   */
  public async generateAISuggestions(
    userExists: any,
    key: string,
    userBusinessProfile: any,
    isRetry: any = false
  ) {
    try {
      let response = null;
      if (
        !userBusinessProfile.isRetry ||
        isRetry == IS_RETRY.TRUE ||
        userBusinessProfile.aiGeneratedSuggestions != key
      ) {
        const prompt = `Business Name:${userBusinessProfile.companyName}, Business Description: ${userBusinessProfile.description}`;
        const textResponse = await this.generateTextSuggestions(
          SYSTEM_INPUT[BUSINESS_ACTIONS[key]],
          prompt
        );
        response = JSON.parse(textResponse.choices[0].message.content);
        if (response && isRetry == IS_RETRY.TRUE) {
          await UserTable.findOneAndUpdate(
            { _id: userExists._id },
            { $inc: { quizCoins: DEDUCT_RETRY_FUEL } }
          );
        }
        await BusinessProfileTable.findOneAndUpdate(
          { userId: userExists._id },
          { $set: { isRetry: true } }
        );
      }
      return {
        suggestions: response,
        finished: true,
        isRetry: true,
        companyName: REQUIRE_COMPANY_NAME.includes(key)
          ? userBusinessProfile.companyName
          : null,
      };
    } catch (error) {
      throw new NetworkError(INVALID_DESCRIPTION_ERROR, 400);
    }
  }

  /**
   * @description this will generate image suggestions using OpenAI GPT and MidJourney
   * @param userExists
   * @param key
   * @param userBusinessProfile
   * @param isRetry
   * @param requestId
   * @param isSystemCall signifies that the function call has been made by system internally, when user completes day-2, quiz-1 to generate images before user plays action-3
   * @param isFromProfile this will be true if user generate AI logos by visiting the profile page
   * @returns {*}
   */
  public async generateAILogos(
    userExists: any,
    key: string,
    userBusinessProfile: any,
    isRetry: string = IS_RETRY.FALSE,
    requestId: string = null,
    isSystemCall: boolean = false,
    isFromProfile: string = IS_RETRY.FALSE
  ) {
    try {
      let response = null;
      await UserTable.findOneAndUpdate(
        { _id: userExists._id },
        { $set: { requestId } },
        { upsert: true }
      );

      const { logoGenerationInfo } = userBusinessProfile;
      const {
        aiSuggestions,
        isUnderProcess,
        startTime,
        isInitialSuggestionsCompleted,
      } = logoGenerationInfo;
      const elapsedTime = moment().unix() - startTime;
      let finished = aiSuggestions?.length === 4;
      if (
        isRetry.toString() == IS_RETRY.FALSE &&
        !isUnderProcess &&
        !finished &&
        !isSystemCall
      ) {
        return {
          finished: true,
          suggestions: isFromProfile == IS_RETRY.TRUE ? null : BACKUP_LOGOS,
          isRetry: true,
        };
      }
      if (
        (!finished && !isUnderProcess) ||
        (!isUnderProcess && isRetry == IS_RETRY.TRUE && finished) ||
        (isUnderProcess && elapsedTime > 200) ||
        isSystemCall
      ) {
        const prompt = `Business Name:${userBusinessProfile.companyName}, Business Description: ${userBusinessProfile.description}`;
        const textResponse = await this.generateTextSuggestions(
          SYSTEM_INPUT[BUSINESS_ACTIONS[key]],
          prompt
        );
        const updateFuel = isRetry === IS_RETRY.TRUE ? DEDUCT_RETRY_FUEL : 0;
        await Promise.all([
          BusinessProfileTable.findOneAndUpdate(
            { userId: userExists._id },
            {
              $set: {
                "logoGenerationInfo.isUnderProcess": true,
                "logoGenerationInfo.startTime": moment().unix(),
                "logoGenerationInfo.aiSuggestions": null,
              },
            },
            { upsert: true }
          ),
          UserTable.findOneAndUpdate(
            { _id: userExists._id },
            {
              $inc: { quizCoins: updateFuel },
            }
          ),
        ]);
        const imageURLs = await this.generateImageSuggestions(
          textResponse.choices[0].message.content
        );
        response = [...imageURLs];
        await BusinessProfileTable.findOneAndUpdate(
          { userId: userExists._id },
          {
            $set: {
              isRetry: true,
              "logoGenerationInfo.isUnderProcess": false,
              "logoGenerationInfo.startTime": moment().unix(),
              "logoGenerationInfo.aiSuggestions": response,
              "logoGenerationInfo.isInitialSuggestionsCompleted": true,
            },
          },
          { upsert: true }
        );
      }
      if (
        isUnderProcess &&
        isRetry == IS_RETRY.FALSE &&
        !isInitialSuggestionsCompleted &&
        isFromProfile == IS_RETRY.FALSE
      ) {
        await BusinessProfileTable.findOneAndUpdate(
          { userId: userExists._id },
          {
            $set: {
              isRetry: true,
              "logoGenerationInfo.isUnderProcess": false,
              "logoGenerationInfo.startTime": moment().unix(),
              "logoGenerationInfo.aiSuggestions": response,
              "logoGenerationInfo.isInitialSuggestionsCompleted": true,
            },
          },
          { upsert: true }
        );
        return {
          finished: true,
          suggestions: BACKUP_LOGOS,
          isRetry: true,
        };
      }

      if (isRetry == IS_RETRY.TRUE && isUnderProcess) {
        finished = false;
      }
      return {
        finished,
        suggestions: finished ? (response ? response : aiSuggestions) : null,
        isRetry: true,
      };
    } catch (error) {
      return {
        finished: true,
        suggestions: BACKUP_LOGOS,
        isRetry: true,
      };
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
      await delay(3000);
      const imageData2 = await UpscaleImage(imagineRes, 2);
      await delay(3000);
      const imageData3 = await UpscaleImage(imagineRes, 3);
      await delay(3000);
      const imageData4 = await UpscaleImage(imagineRes, 4);
      return [imageData1.uri, imageData2.uri, imageData3.uri, imageData4.uri];
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }
}
export default new BusinessProfileService();
