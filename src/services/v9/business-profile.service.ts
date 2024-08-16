import {
  BusinessProfileTable,
  UserTable,
  AIToolsUsageStatusTable,
  ProblemScoreTable,
  MarketScoreTable,
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
  COMPANY_NAME_TYPE,
  DEDUCT_RETRY_FUEL,
  KEY_METRICS_TYPE,
  COST_STRUCTURE_TYPE,
  TARGET_AUDIENCE_REQUIRED,
} from "@app/utility";
import moment from "moment";
import { BusinessProfileService as BusinessProfileServiceV7 } from "@app/services/v7";
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
    type: number = 1
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
      const prompt = this.getUserPrompt(userBusinessProfile, key, idea);
      let systemInput: any = (await AIToolDataSetTable.findOne({ key }).lean())
        .data;
      if (key == "companyName") {
        systemInput = systemInput[COMPANY_NAME_TYPE[type]];
      } else if (key == "keyMetrics") {
        systemInput = systemInput[KEY_METRICS_TYPE[type]];
      } else if (key == "costStructure") {
        systemInput = systemInput[COST_STRUCTURE_TYPE[type]];
      }
      const [response, _] = await Promise.all([
        this.getFormattedSuggestions(systemInput, prompt),
        AIToolsUsageStatusTable.findOneAndUpdate(
          { userId: userExists._id },
          { $set: aiToolUsageObj },
          { upsert: true }
        ),
      ]);
      if (response && !userExists.isPremiumUser) {
        await this.updateAIToolsRetryStatus(userExists, key);
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

      const { logoGenerationInfo = null, companyName = "" } =
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
        BusinessProfileServiceV7.generateImageSuggestions(
          textResponse.choices[0].message.content
        ).then(async (imageUrls) => {
          response = [...imageUrls];
          await BusinessProfileTable.findOneAndUpdate(
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
          );
        });
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
   * @returns {*}
   */
  public async getBusinessHistory(businessHistory, milestoneGoals) {
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
        const matchedGoal = milestoneGoals.find(
          (goal) => goal.key == entry.key
        );

        if (entry.key) {
          if (!acc[groupKey]) {
            acc[groupKey] = [];
          }

          acc[groupKey].push({
            key: entry.key,
            value: entry.value,
            timestamp: entry.timestamp,
            day: day,
            iconImage: matchedGoal?.iconImage,
            iconBackgroundColor: matchedGoal?.iconBackgroundColor,
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
              ({ key, value, day, iconImage, iconBackgroundColor }) => ({
                _id: ++order,
                key: key,
                details: value,
                date: day,
                iconImage,
                iconBackgroundColor,
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
  async updateAIToolsRetryStatus(userExists: any, key: any) {
    try {
      let aiToolUsageObj = {};
      let tool = `${key}Retry`;
      aiToolUsageObj[tool] = true;
      await Promise.all([
        AIToolsUsageStatusTable.findOneAndUpdate(
          { userId: userExists._id },
          { $set: aiToolUsageObj },
          { upsert: true, new: true }
        ),
        UserTable.findOneAndUpdate(
          { _id: userExists._id },
          { $inc: { quizCoins: DEDUCT_RETRY_FUEL } },
          { upsert: true, new: true }
        ),
      ]);
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }

  /**
   * @description this method will return the user input prompt corresponding to the AI Tool being used
   * @param businessProfile
   * @param key
   * @param idea
   * @returns prompt
   */
  getUserPrompt(businessProfile: any, key: string, idea: string) {
    try {
      if (TARGET_AUDIENCE_REQUIRED.includes(key)) {
        if (
          businessProfile.targetAudience &&
          businessProfile.targetAudience.description
        ) {
          return `Business Description: ${idea} ${businessProfile.targetAudience.description}`;
        } else {
          throw new Error("Please add your target audience and try again!");
        }
      }
      return `Business Description: ${idea}`;
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }

  /**
   * @description get business profile
   */
  public async getBusinessProfile(id: string) {
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
    const {
      userId,
      impacts,
      passions,
      hoursSaved,
      businessCoachInfo,
      enableStealthMode,
      completedGoal,
    } = userBusinessProfile;
    let businessProfile = {
      userId,
      impacts,
      passions,
      hoursSaved,
      businessCoachInfo,
      enableStealthMode,
      completedGoal,
      businessPlans: [],
    };

    if (userBusinessProfile) {
      if (userBusinessProfile.description) {
        const action = milestoneGoals.find(
          (goal) => goal.key == "ideaValidation"
        );
        businessProfile.businessPlans.push({
          key: "description",
          type: businessIdeaCopy.inputType,
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
            type: data.inputType,
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
}
export default new BusinessProfileService();
