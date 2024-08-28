import {
  BusinessProfileTable,
  UserTable,
  AIToolsUsageStatusTable,
  ProblemScoreTable,
  MarketScoreTable,
  UnsavedLogoTable,
  AIToolDataSetTable,
  SuggestionScreenCopyTable,
  MilestoneGoalsTable,
} from "@app/model";
import { NetworkError } from "@app/middleware";
import {
  INVALID_DESCRIPTION_ERROR,
  IS_RETRY,
  REQUIRE_COMPANY_NAME,
  BACKUP_LOGOS,
  awsLogger,
  BUSINESS_IDEA_IMAGES,
  PRODUCT_TYPE,
  DEDUCT_RETRY_FUEL,
  TARGET_AUDIENCE_REQUIRED,
  AI_TOOL_DATASET_TYPES,
} from "@app/utility";
import moment from "moment";
import { BusinessProfileService as BusinessProfileServiceV7 } from "@app/services/v7";
import { MilestoneDBService } from "@app/services/v9";
import { ObjectId } from "mongodb";

class BusinessProfileService {
  /**
   * @description this will generate business idea using OpenAI GPT
   * @param userExists
   * @param key
   * @param userBusinessProfile
   * @param idea user input to generate business logo
   * @returns {*}
   */
  public async generateAISuggestions(
    userExists: any,
    key: string,
    userBusinessProfile: any,
    idea: string = null,
    type: number = 1,
    answerOfTheQuestion: string = null,
    retry: boolean = false
  ) {
    try {
      if (!idea) {
        throw new NetworkError(
          "Please provide a valid business description",
          404
        );
      }
      let aiToolUsageObj = {};
      aiToolUsageObj[key] = true;
      const [systemDataset, goalDetails, suggestionsScreenCopy] =
        await Promise.all([
          AIToolDataSetTable.findOne({ key }).lean(),
          MilestoneGoalsTable.findOne({ key }).lean(),
          SuggestionScreenCopyTable.find().lean(),
        ]);
      const prompt = this.getUserPrompt(
        userBusinessProfile,
        key,
        idea,
        goalDetails?.dependency,
        suggestionsScreenCopy,
        answerOfTheQuestion
      );
      let systemInput: any = systemDataset.data;
      if (Object.keys(AI_TOOL_DATASET_TYPES).includes(key)) {
        systemInput = systemInput[AI_TOOL_DATASET_TYPES[key][type]];
      }
      const response = await this.getFormattedSuggestions(systemInput, prompt);
      if (response) {
        await AIToolsUsageStatusTable.findOneAndUpdate(
          { userId: userExists._id },
          { $set: aiToolUsageObj },
          { upsert: true }
        );
      }
      if (response && !userExists.isPremiumUser && retry) {
        await this.updateAIToolsRetryStatus(userExists);
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
      if (
        TARGET_AUDIENCE_REQUIRED.includes(key) &&
        !userBusinessProfile.targetAudience
      ) {
        throw new Error("Please add your target audience and try again!");
      }
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
   * @param idea user input to generate business logo
   * @returns {*}
   */
  public async generateAILogos(
    userExists: any,
    key: string,
    userBusinessProfile: any,
    isRetry: string = IS_RETRY.FALSE,
    requestId: string = null,
    idea: string = null
  ) {
    try {
      let response = null;
      await UserTable.findOneAndUpdate(
        { _id: userExists._id },
        { $set: { requestId } },
        { upsert: true }
      );

      const { logoGenerationInfo = null, companyName = null } =
        userBusinessProfile ?? {};
      const {
        aiSuggestions = [],
        isUnderProcess = false,
        startTime = 0,
      } = logoGenerationInfo ?? {};
      const elapsedTime = moment().unix() - startTime;
      let finished = aiSuggestions?.length === 4;
      if (
        (!finished && !isUnderProcess) ||
        (!isUnderProcess && isRetry == IS_RETRY.TRUE && finished) ||
        (isUnderProcess && elapsedTime > 200)
      ) {
        finished = false;
        if (!idea) {
          throw new NetworkError(
            "Please provide a valid business description",
            404
          );
        }
        const prompt = companyName
          ? `Company Name:${companyName}, Business Idea: ${idea}`
          : `Business Idea: ${idea}`;
        const systemInput = await AIToolDataSetTable.findOne({ key });
        const [textResponse, _] = await Promise.all([
          BusinessProfileServiceV7.generateTextSuggestions(
            systemInput.data,
            prompt
          ),
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
        ]);
        const imagePrompt = textResponse.choices[0].message.content;
        BusinessProfileServiceV7.generateImageSuggestions(imagePrompt).then(
          async (imageUrls) => {
            response = [...imageUrls];
            await Promise.all([
              BusinessProfileTable.findOneAndUpdate(
                { userId: userExists._id },
                {
                  $set: {
                    "logoGenerationInfo.isUnderProcess": false,
                    "logoGenerationInfo.startTime": moment().unix(),
                    "logoGenerationInfo.aiSuggestions": response,
                    "logoGenerationInfo.isInitialSuggestionsCompleted": true,
                  },
                },
                { upsert: true }
              ),
              UnsavedLogoTable.findOneAndUpdate(
                { userId: userExists._id },
                { $set: { logoGeneratedAt: moment().unix() } },
                { upsert: true, new: true }
              ),
            ]);
          }
        );
      }

      if (isRetry == IS_RETRY.TRUE && isUnderProcess) {
        finished = false;
      }
      if (finished && !userExists.isPremiumUser && isRetry) {
        await this.updateAIToolsRetryStatus(userExists);
      }
      return {
        finished,
        suggestions: finished ? (response ? response : aiSuggestions) : null,
        isRetry: true,
      };
    } catch (error) {
      awsLogger.error(`{function:generateAILogos || message:${error.message}}`);
      return {
        finished: true,
        suggestions: BACKUP_LOGOS,
        isRetry: true,
      };
    }
  }

  /**
   * @description get business history in descending order of dates
   * @param businessHistory
   * @param milestoneGoals
   * @param suggestionsScreenCopy
   * @returns {*}
   */
  public async getBusinessHistory(
    businessHistory: any,
    milestoneGoals: any,
    suggestionsScreenCopy: any
  ) {
    try {
      const today = new Date(Date.now()).toLocaleDateString();
      const sortedHistory = businessHistory.sort(
        (a, b) => b.timestamp - a.timestamp
      );
      const groupedHistory = sortedHistory.reduce((acc, entry) => {
        const date = new Date(entry.timestamp);
        const year = date.getFullYear();
        const month = date.toLocaleString("default", { month: "long" });
        const day = date.toLocaleDateString();

        const groupKey = day == today ? "Today" : `In ${month} ${year}`;
        const currentKey =
          entry.key == "description" || entry.key == "ideaValidation"
            ? "ideaValidation"
            : entry.key;
        const matchedGoal = milestoneGoals.find(
          (goal) => goal.key == currentKey
        );
        const matchedGoalCopy = suggestionsScreenCopy.find(
          (obj) => obj.key == currentKey
        );

        if (entry.key) {
          if (!acc[groupKey]) {
            acc[groupKey] = [];
          }

          acc[groupKey].push({
            title: matchedGoalCopy.actionName,
            key: entry.key,
            value: entry.value,
            timestamp: entry.timestamp,
            day: day,
            iconImage: matchedGoal?.iconImage,
            iconBackgroundColor: matchedGoal?.iconBackgroundColor,
            name: matchedGoalCopy.name,
          });
        }
        return acc;
      }, {});

      let periodId = 0;
      const response = Object.entries(groupedHistory).map(
        ([key, values]: any) => {
          let order = 0;
          return {
            _id: ++periodId,
            title: key,
            data: values.map(
              ({
                title,
                key,
                value,
                day,
                iconImage,
                iconBackgroundColor,
                name,
              }) => ({
                _id: ++order,
                title,
                key,
                details: value,
                date: day,
                iconImage,
                iconBackgroundColor,
                name,
              })
            ),
          };
        }
      );

      return response;
    } catch (error) {
      throw new NetworkError("Data not found", 400);
    }
  }

  /**
   * @description this will generate business idea using OpenAI GPT
   * @param prompt
   * @param businessType
   * @returns {*}
   */
  public async generateBusinessIdea(prompt: string, businessType: number) {
    try {
      const systemInputDataset = (
        await AIToolDataSetTable.findOne({
          type: businessType,
        }).lean()
      ).data;
      const marketSelectionData = await this.getFormattedSuggestions(
        systemInputDataset["PROBLEM_MARKET_SELECTOR"],
        prompt
      );
      const updatedPrompt = marketSelectionData.market;
      let [productizationData, distributionData, dominateNicheData] =
        await Promise.all([
          this.getFormattedSuggestions(
            systemInputDataset["PRODUCTIZATION"],
            updatedPrompt
          ),
          this.getFormattedSuggestions(
            systemInputDataset["DISTRIBUTION"],
            updatedPrompt
          ),
          this.getFormattedSuggestions(
            systemInputDataset["DOMINATE_NICHE"],
            updatedPrompt
          ),
        ]);

      const [
        problemAnalysisData,
        marketAnalysisData,
        productizationRatingData,
        distributionRatingData,
        dominateNicheRatingData,
      ] = await Promise.all([
        ProblemScoreTable.find({
          problem: marketSelectionData.problem.replace(/\.$/, ""),
          type: businessType,
        }).lean(),
        MarketScoreTable.find({
          marketSegment: marketSelectionData.market.replace(/\.$/, ""),
          type: businessType,
        }).lean(),
        this.getFormattedSuggestions(
          systemInputDataset["PRODUCT_RATING"],
          productizationData.description
        ),
        this.getFormattedSuggestions(
          systemInputDataset["PRODUCT_RATING"],
          distributionData.description
        ),
        this.getFormattedSuggestions(
          systemInputDataset["PRODUCT_RATING"],
          dominateNicheData.description
        ),
      ]);

      let order = 0;
      const ideasData = [
        {
          data: productizationData,
          label: systemInputDataset["PRODUCTIZATION_LABEL"],
          imageKey: "innovative",
          ratingData: productizationRatingData,
        },
        {
          data: distributionData,
          label: systemInputDataset["DISTRIBUTION_LABEL"],
          imageKey: "demand",
          ratingData: distributionRatingData,
        },
        {
          data: dominateNicheData,
          label: systemInputDataset["DOMINATE_LABEL"],
          imageKey: "trending",
          ratingData: dominateNicheRatingData,
        },
      ];
      const BUSINESS_IDEA_IMAGES_BY_TYPE =
        businessType === PRODUCT_TYPE.Physical
          ? BUSINESS_IDEA_IMAGES.PHYSICAL_PRODUCT
          : BUSINESS_IDEA_IMAGES.TECH_PRODUCT;
      const ideas = ideasData.map(({ data, label, imageKey, ratingData }) => {
        data.ideaLabel = label;
        data.image = BUSINESS_IDEA_IMAGES_BY_TYPE[imageKey];
        data._id = `idea${++order}`;

        const problem = problemAnalysisData.find(
          (obj) =>
            obj.problem === marketSelectionData.problem.replace(/\.$/, "")
        );
        const market = marketAnalysisData.find(
          (obj) =>
            obj.marketSegment === marketSelectionData.market.replace(/\.$/, "")
        );

        data.rating = Math.floor(
          (problem.overallRating +
            market.overallRating +
            ratingData["Overall Score"]) /
            3
        );
        data.ideaAnalysis = this.ideaAnalysis(problem, ratingData, market);

        return data;
      });
      return { ideas };
    } catch (error) {
      throw new NetworkError(INVALID_DESCRIPTION_ERROR, 400);
    }
  }

  /**
   * @description this will validate user provided business idea using OpenAI GPT
   * @param prompt
   * @returns {*}
   */
  public async ideaValidator(prompt: string) {
    try {
      const ideaValidationDataset = (
        await AIToolDataSetTable.findOne({
          type: 3,
        }).lean()
      ).data;
      const businessIdeaType = await this.getFormattedSuggestions(
        ideaValidationDataset["BUSINESS_TYPE_SELECTOR"],
        prompt
      );
      const businessType =
        JSON.stringify(businessIdeaType).indexOf("ecommerce") >= 0
          ? PRODUCT_TYPE.Physical
          : PRODUCT_TYPE.Software;
      const systemInputDataset =
        businessType === PRODUCT_TYPE.Physical
          ? ideaValidationDataset["PHYSICAL_PRODUCT"]
          : ideaValidationDataset["TECH_PRODUCT"];
      let validatedIdea = await this.getFormattedSuggestions(
        systemInputDataset,
        prompt
      );

      const updatedPrompt = `${validatedIdea.problem}\n ${validatedIdea.market}`;
      const [problemAnalysisData, marketAnalysisData, productAnalysisData] =
        await Promise.all([
          ProblemScoreTable.find({
            problem: validatedIdea.problem,
            type: businessType,
          }),
          MarketScoreTable.find({
            marketSegment: validatedIdea.market,
            type: businessType,
          }),
          this.getFormattedSuggestions(
            ideaValidationDataset["PRODUCT_RATING"],
            updatedPrompt
          ),
        ]);

      const problem = problemAnalysisData.find(
        (obj) => obj.problem == validatedIdea.problem
      );
      const market = marketAnalysisData.find(
        (obj) => obj.marketSegment == validatedIdea.market
      );

      validatedIdea["_id"] = "selfIdea";
      validatedIdea["ideaLabel"] =
        ideaValidationDataset["IDEA_VALIDATION_LABEL"];
      validatedIdea["rating"] = Math.floor(
        (problem.overallRating +
          market.overallRating +
          productAnalysisData["Overall Score"]) /
          3
      );
      validatedIdea["ideaAnalysis"] = this.ideaAnalysis(
        problem,
        productAnalysisData,
        market
      );
      if (businessType == PRODUCT_TYPE.Physical) {
        validatedIdea["image"] = BUSINESS_IDEA_IMAGES.PHYSICAL_PRODUCT.user;
      } else {
        validatedIdea["image"] = BUSINESS_IDEA_IMAGES.TECH_PRODUCT.user;
      }

      let suggestions = (await this.generateBusinessIdea(prompt, businessType))
        .ideas;

      let response = {
        selfIdea: validatedIdea,
        ideas: [...suggestions],
      };

      return response;
    } catch (error) {
      throw new NetworkError(INVALID_DESCRIPTION_ERROR, 400);
    }
  }

  /**
   * @description this method will get the response and do the formatting
   * @param systemInput
   * @param prompt
   * @returns {*}
   */
  public async getFormattedSuggestions(systemInput: string, prompt: string) {
    try {
      const response = await BusinessProfileServiceV7.generateTextSuggestions(
        systemInput,
        prompt
      );
      const recommendations = JSON.parse(
        JSON.stringify(response.choices[0].message)
      );
      const jsonResponse = JSON.parse(
        recommendations.content.replace(/```json|```/g, "").trim()
      );
      if (
        jsonResponse &&
        Array.isArray(jsonResponse) &&
        jsonResponse.length > 0 &&
        (jsonResponse[0]?.title == "N/A" ||
          jsonResponse[0]?.title == undefined ||
          jsonResponse[0]?.title == "undefined")
      ) {
        throw new NetworkError(INVALID_DESCRIPTION_ERROR, 400);
      }
      return jsonResponse;
    } catch (error) {
      throw new NetworkError(INVALID_DESCRIPTION_ERROR, 400);
    }
  }

  /**
   * @description this method will update the Idea Generator usage status used while onboarding
   * @param userExists
   * @param data
   * @returns {*}
   */
  public async onboardingIdeaUpdate(userExists: any, data: any) {
    try {
      let aiToolUsageObj = {};
      aiToolUsageObj[data.ideaGenerationType] = true;
      if (userExists && userExists._id && data.savedBusinessIdeas.length) {
        const businessProfile = await BusinessProfileTable.findOne({
          userId: userExists._id,
        });
        const [_, updatedUser] = await Promise.all([
          AIToolsUsageStatusTable.findOneAndUpdate(
            { userId: userExists._id },
            { $set: aiToolUsageObj },
            { upsert: true, new: true }
          ),
          BusinessProfileServiceV7.addOrEditBusinessProfile(
            data,
            userExists,
            businessProfile
          ),
        ]);
        return updatedUser;
      }
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }

  /**
   * @description this method will return the formatted market analysis report
   * @param problem problem analysis and rating
   * @param product product analysis and rating
   * @param market market analysis and rating
   * @returns {*}
   */
  private ideaAnalysis(problem: any, product: any, market: any) {
    try {
      return [
        {
          _id: "problem",
          name: "Problem",
          rating: problem.overallRating,
          analysis: [
            {
              name: "Trending Topic",
              rating: problem.trendingScore,
              description: problem.trendingScoreExplanation,
            },
            {
              name: "Willingness to Pay",
              rating: problem.demandScore,
              description: problem.demandScoreExplanation,
            },
            {
              name: "Paying Customers",
              rating: problem.pricePointIndex,
              description: problem.pricePointExplanation,
            },
          ],
        },
        {
          _id: "product",
          name: "Product",
          rating: Math.floor(Number(product["Overall Score"])),
          analysis: [
            {
              name: "Niche Audience",
              rating: product["Audience Focus Score"],
              description: product.audienceFocusScoreDescription,
            },
            {
              name: "Core Features",
              rating: product["Sophistication Score"],
              description: product.sophisticationDescription,
            },
            {
              name: "Differentiation",
              rating: product["Unique Score"],
              description: product.uniqueScoreDescription,
            },
          ],
        },

        {
          _id: "market",
          name: "Market",
          rating: market.overallRating,
          analysis: [
            {
              name: "HHI",
              rating: market.hhiRating,
              description: market.hhiExplanation,
            },
            {
              name: "Satisfaction",
              rating: market.customerSatisfactionRating,
              description: market.customerSatisfactionExplanation,
            },
            {
              name: "Age Index",
              rating: market.ageIndexRating,
              description: market.ageIndexExplanation,
            },
            {
              name: "TAM",
              rating: market.tamRating,
              description: market.tamExplanation,
            },
            {
              name: "CAGR",
              rating: market.cagrRating,
              description: market.cagrExplanation,
            },
          ],
        },
      ];
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }

  /**
   * @description this method will update whether the user has consumed the retry using fuels
   * @param userExists
   * @param key
   */
  async updateAIToolsRetryStatus(userExists: any) {
    try {
      await UserTable.findOneAndUpdate(
        { _id: userExists._id },
        { $inc: { quizCoins: DEDUCT_RETRY_FUEL } },
        { upsert: true, new: true }
      );
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }

  /**
   * @description this method will return the user input prompt corresponding to the AI Tool being used
   * @param businessProfile
   * @param key
   * @param idea
   * @param dependency
   * @param screenCopy
   * @param userAnswer
   * @returns prompt
   */
  getUserPrompt(
    businessProfile: any,
    key: string,
    idea: string,
    dependency: string[] = [],
    screenCopy: any,
    userAnswer: string = null
  ) {
    try {
      let prompt = ``;
      for (let i = 0; i < dependency.length; i++) {
        if (dependency[i] == "description") {
          prompt = `${prompt}\nBusiness Description: ${idea}`;
        } else {
          const depDetails = screenCopy.find((obj) => obj.key == dependency[i]);
          if (depDetails.name && businessProfile[dependency[i]]) {
            prompt = `${prompt}\n${depDetails.name}: ${
              businessProfile[dependency[i]]
            }`;
          }
        }
      }
      return prompt;
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }

  /**
   * @description get business profile
   */
  public async getBusinessProfile(id: string) {
    let businessProfile;
    let [
      userBusinessProfile,
      suggestionsScreenCopy,
      businessIdeaCopy,
      milestoneGoals,
    ] = await Promise.all([
      BusinessProfileTable.findOne({
        userId: new ObjectId(id),
      }).lean(),
      SuggestionScreenCopyTable.find().lean(),
      SuggestionScreenCopyTable.findOne({ key: "ideaValidation" }).lean(),
      MilestoneGoalsTable.find().lean(),
    ]);

    if (userBusinessProfile) {
      const {
        userId,
        impacts,
        passions,
        hoursSaved,
        businessCoachInfo,
        enableStealthMode,
        completedGoal,
      } = userBusinessProfile;
      businessProfile = {
        userId,
        impacts,
        passions,
        hoursSaved,
        businessCoachInfo,
        enableStealthMode,
        completedGoal,
        businessPlans: [],
      };
      if (userBusinessProfile.description) {
        const action = milestoneGoals.find(
          (goal) => goal.key == "ideaValidation"
        );
        businessProfile.businessPlans.push({
          key: "description",
          type: businessIdeaCopy.actionType,
          value: userBusinessProfile.description,
          idea: userBusinessProfile.idea,
          title: businessIdeaCopy.name,
          actionName: businessIdeaCopy.actionName,
          placeHolderText: businessIdeaCopy.placeHolderText,
          isMultiLine: businessIdeaCopy.isMultiLine,
          maxCharLimit: businessIdeaCopy.maxCharLimit,
          section: businessIdeaCopy.section,
          iconImage: action.iconImage,
          iconBackgroundColor: action.iconBackgroundColor,
        });
      }
      suggestionsScreenCopy.forEach((data) => {
        if (
          userBusinessProfile[data.key] &&
          (userBusinessProfile[data.key].length ||
            userBusinessProfile[data.key].title)
        ) {
          const action = milestoneGoals.find((goal) => goal.key == data.key);
          const obj = {
            key: data.key,
            type: data.actionType,
            value: userBusinessProfile[data.key],
            title: data.name,
            actionName: data.actionName,
            placeHolderText: data.placeHolderText,
            isMultiLine: data.isMultiLine,
            maxCharLimit: data.maxCharLimit,
            section: data.section,
            iconImage: action.iconImage,
            iconBackgroundColor: action.iconBackgroundColor,
          };
          businessProfile.businessPlans.push(obj);
        }
      });
    }
    return businessProfile;
  }

  /**
   * @description get AI toolbox
   */
  public async getAIToolbox() {
    let ideaValidationObj = {};
    let milestoneGoals = await MilestoneGoalsTable.find({
      isAiToolbox: true,
    }).lean();
    let response = await MilestoneDBService.suggestionScreenInfo(
      milestoneGoals
    );
    response = response.map((obj) => {
      if (obj.key == "ideaValidation") {
        ideaValidationObj = obj;
        return { ...obj, name: "Business Idea", key: "description" };
      } else if (obj.key == "colorsAndAesthetic") {
        return {
          ...obj,
          name: "Brand Aestheitic",
          iconImage: "artist_palette.webp",
        };
      }
      return obj;
    });
    const ideaValidationTool = {
      ...ideaValidationObj,
      name: "Idea Validation",
      key: "ideaValidation",
      iconBackgroundColor: "#00FF8729",
      iconImage: "magnifire.webp",
    };
    response.splice(1, 0, ideaValidationTool);

    return response;
  }
}
export default new BusinessProfileService();
