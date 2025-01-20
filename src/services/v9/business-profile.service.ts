import {
  BusinessProfileTable,
  UserTable,
  AIToolsUsageStatusTable,
  UnsavedLogoTable,
  AIToolDataSetTable,
  SuggestionScreenCopyTable,
  MilestoneGoalsTable,
  AIToolDataSetTypesTable,
} from "@app/model";
import { NetworkError } from "@app/middleware";
import {
  INVALID_DESCRIPTION_ERROR,
  IS_RETRY,
  REQUIRE_COMPANY_NAME,
  BACKUP_LOGOS,
  awsLogger,
  BUSINESS_IDEA_IMAGES,
  DEDUCT_RETRY_FUEL,
  TARGET_AUDIENCE_REQUIRED,
  COLORS_AND_AESTHETIC,
  SUGGESTIONS_NOT_FOUND_ERROR,
  mapHasGoalKey,
  IDEA_GENERATOR_INFO,
  IDEA_ANALYSIS,
  replacePlaceholders,
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
    type: string = "1",
    answerOfTheQuestion: string = null,
    isRetry: string = IS_RETRY.FALSE,
    preload: boolean = false
  ) {
    try {
      let response = null;
      if (!idea) {
        throw new NetworkError(
          "Please provide a valid business description",
          404
        );
      }
      const availableTokens = userExists.preLoadedCoins + userExists.quizCoins;
      const isPremiumUser = userExists.isPremiumUser;
      if (
        !isPremiumUser &&
        isRetry == IS_RETRY.TRUE &&
        availableTokens < DEDUCT_RETRY_FUEL
      ) {
        throw new NetworkError("Not enough tokens available", 404);
      }
      if (
        isRetry == IS_RETRY.FALSE &&
        userBusinessProfile?.aiGeneratedSuggestions?.[key] != null
      ) {
        response = userBusinessProfile?.aiGeneratedSuggestions?.[key];
      } else {
        const [
          systemDataset,
          goalDetails,
          suggestionsScreenCopy,
          datasetTypes,
        ] = await Promise.all([
          AIToolDataSetTable.findOne({ key }).lean(),
          MilestoneGoalsTable.aggregate([
            {
              $match: { key },
            },
            {
              $lookup: {
                from: "action_scoring_criterias",
                localField: "key",
                foreignField: "key",
                as: "scoringCriteria",
              },
            },
            {
              $unwind: {
                path: "$scoringCriteria",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $project: {
                dependency: 1,
                key: 1,
                scoringCriteria: "$scoringCriteria.scoringCriteria",
              },
            },
          ]).exec(),
          SuggestionScreenCopyTable.find().lean(),
          AIToolDataSetTypesTable.findOne({ key }).lean(),
        ]);
        const prompt = await this.getUserPrompt(
          userBusinessProfile,
          idea,
          suggestionsScreenCopy,
          goalDetails[0]?.dependency,
          answerOfTheQuestion,
          preload
        );
        /**
         * If any dependency is not resolved, then return
         */
        if (!prompt) {
          return;
        }
        let systemInput: any = systemDataset.data;
        if (type && typeof systemInput == "object") {
          systemInput = systemInput[datasetTypes.types[type]];
        }
        response = await this.getFormattedSuggestions(systemInput, prompt, key);
        response?.sort((a, b) => a?.title?.localeCompare(b?.title));
        const scoringCriteria = goalDetails[0]?.scoringCriteria[type];
        response.forEach((obj) => {
          let strengths = { title: "Strengths", data: [] };
          let weaknesses = { title: "Weaknesses", data: [] };
          obj.scores.forEach((score, idx) => {
            score.icon = scoringCriteria[idx]?.icon;
            score.explanation = scoringCriteria[idx]?.description || "";
            score.score < 50
              ? weaknesses.data.push(score)
              : strengths.data.push(score);
          });
          obj.scores = [strengths, weaknesses];
          obj.scores[0]?.data.sort((a, b) => a.score - b.score);
          obj.scores[1]?.data.sort((a, b) => a.score - b.score);
        });
        if (response) {
          this.saveAIActionResponse(userExists, key, response);
          if (!isPremiumUser && isRetry == IS_RETRY.TRUE) {
            await this.updateAIToolsRetryStatus(userExists);
          }
        }
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
      throw new NetworkError(SUGGESTIONS_NOT_FOUND_ERROR, 400);
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
      if (finished && !userExists.isPremiumUser && isRetry == IS_RETRY.TRUE) {
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
          entry.key == "description" ? "ideaValidation" : entry.key;
        const matchedGoal = milestoneGoals.find(
          (goal) => goal.key == currentKey
        );
        const matchedGoalCopy = suggestionsScreenCopy.find(
          (obj) => obj.key == entry.key
        );

        if (entry.key) {
          if (!acc[groupKey]) {
            acc[groupKey] = [];
          }
          let value = entry.value;
          if (entry.key == "companyLogo") {
            value = entry.value;
          } else if (typeof entry.value === "string") {
            value = {
              title: entry.value,
              descripition: " ",
            };
          }

          acc[groupKey].push({
            title: matchedGoalCopy.actionName,
            key: entry.key,
            value: value,
            timestamp: entry.timestamp,
            day: day,
            iconImage: matchedGoalCopy?.iconImage,
            iconBackgroundColor: matchedGoalCopy?.iconBackgroundColor,
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
   * @param isRetry
   * @param userExists
   * @returns {*}
   */
  public async generateBusinessIdea(
    prompt: string,
    isRetry: boolean,
    userExists: any
  ) {
    try {
      const systemInputDataset = await AIToolDataSetTable.find({
        key: {
          $in: [
            IDEA_GENERATOR_INFO.SOFTWARE_TECHNOLOGY,
            IDEA_GENERATOR_INFO.IDEA_GENERATOR,
          ],
        },
      }).lean();
      const ideaGenerator = systemInputDataset.find(
        (obj) => obj.key == IDEA_GENERATOR_INFO.IDEA_GENERATOR
      )?.data;
      const softwareTechnology = systemInputDataset.find(
        (obj) => obj.key == IDEA_GENERATOR_INFO.SOFTWARE_TECHNOLOGY
      )?.data;

      const types = ["type1", "type2", "type3"];
      const ideaPromises = types.map((type) =>
        this.getFormattedSuggestions(ideaGenerator[type], prompt)
      );
      const ideaResults = await Promise.all(ideaPromises);

      const problemPromises = ideaResults.map((idea) =>
        this.getFormattedSuggestions(
          softwareTechnology[IDEA_GENERATOR_INFO.PROBLEM_RATING],
          idea.description
        )
      );

      const productPromises = ideaResults.map((idea) =>
        this.getFormattedSuggestions(
          softwareTechnology[IDEA_GENERATOR_INFO.PRODUCT_RATING],
          idea.description
        )
      );

      const marketPromises = ideaResults.map((idea) =>
        this.getFormattedSuggestions(
          softwareTechnology[IDEA_GENERATOR_INFO.MARKET_RATING],
          idea.description
        )
      );

      // Fetch problem, rating, and market suggestions in parallel
      const [problemRatings, productRatings, marketRatings] = await Promise.all(
        [
          Promise.all(problemPromises),
          Promise.all(productPromises),
          Promise.all(marketPromises),
        ]
      );

      let order = 0;
      const ideasData = [
        {
          data: ideaResults[0],
          problemData: problemRatings[0],
          label: softwareTechnology[IDEA_GENERATOR_INFO.PRODUCTIZATION.label],
          imageKey: IDEA_GENERATOR_INFO.PRODUCTIZATION.image,
          productData: productRatings[0],
          marketData: marketRatings[0],
        },
        {
          data: ideaResults[1],
          problemData: problemRatings[1],
          label: softwareTechnology[IDEA_GENERATOR_INFO.DISTRIBUTION.label],
          imageKey: IDEA_GENERATOR_INFO.DISTRIBUTION.image,
          productData: productRatings[1],
          marketData: marketRatings[1],
        },
        {
          data: ideaResults[2],
          problemData: problemRatings[2],
          label: softwareTechnology[IDEA_GENERATOR_INFO.DOMINATE_NICHE.label],
          imageKey: IDEA_GENERATOR_INFO.DOMINATE_NICHE.image,
          productData: productRatings[2],
          marketData: marketRatings[2],
        },
      ];
      const BUSINESS_IDEA_IMAGES_BY_TYPE = BUSINESS_IDEA_IMAGES.TECH_PRODUCT;
      const ideas = ideasData.map(
        ({ data, problemData, label, imageKey, productData, marketData }) => {
          data.ideaLabel = label;
          data.image = BUSINESS_IDEA_IMAGES_BY_TYPE[imageKey];
          data._id = `idea${++order}`;

          data.rating = Math.floor(
            (Number(problemData.average) +
              marketData.average +
              productData.average) /
              3
          );
          data.ideaAnalysis = this.ideaAnalysis(
            problemData,
            productData,
            marketData
          );

          return data;
        }
      );
      if (ideas && !userExists.isPremiumUser && isRetry) {
        await this.updateAIToolsRetryStatus(userExists);
      }
      return { ideas };
    } catch (error) {
      throw new NetworkError(INVALID_DESCRIPTION_ERROR, 400);
    }
  }

  /**
   * @description this will validate user provided business idea using OpenAI GPT
   * @param prompt
   * @param isRetry
   * @param userExists
   * @returns {*}
   */
  public async ideaValidator(
    prompt: string,
    isRetry: boolean,
    userExists: any
  ) {
    try {
      const ideaValidationDataset = (
        await AIToolDataSetTable.findOne({
          key: IDEA_GENERATOR_INFO.IDEA_VALIDATION,
        }).lean()
      ).data;

      let validatedIdea = await this.getFormattedSuggestions(
        ideaValidationDataset[IDEA_GENERATOR_INFO.IDEA_VALIDATOR_GENERATOR],
        prompt
      );

      const updatedPrompt = validatedIdea.description;
      const [problemAnalysisData, marketAnalysisData, productAnalysisData] =
        await Promise.all([
          this.getFormattedSuggestions(
            ideaValidationDataset[IDEA_GENERATOR_INFO.PROBLEM_RATING],
            updatedPrompt
          ),
          this.getFormattedSuggestions(
            ideaValidationDataset[IDEA_GENERATOR_INFO.MARKET_RATING],
            updatedPrompt
          ),
          this.getFormattedSuggestions(
            ideaValidationDataset[IDEA_GENERATOR_INFO.PRODUCT_RATING],
            updatedPrompt
          ),
        ]);

      validatedIdea["_id"] = IDEA_GENERATOR_INFO.SELF_IDEA;
      validatedIdea["ideaLabel"] =
        ideaValidationDataset[IDEA_GENERATOR_INFO.IDEA_VALIDATION_LABEL];
      validatedIdea["rating"] = Math.floor(
        (Number(problemAnalysisData.average) +
          marketAnalysisData.average +
          productAnalysisData.average) /
          3
      );
      validatedIdea["ideaAnalysis"] = this.ideaAnalysis(
        problemAnalysisData,
        productAnalysisData,
        marketAnalysisData
      );
      validatedIdea["image"] = BUSINESS_IDEA_IMAGES.TECH_PRODUCT.user;

      if (validatedIdea && !userExists.isPremiumUser && isRetry) {
        await this.updateAIToolsRetryStatus(userExists);
      }
      return {
        ideas: [validatedIdea],
      };
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
  public async getFormattedSuggestions(
    systemInput: string,
    prompt: string,
    key: string = null
  ) {
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
      if (key == COLORS_AND_AESTHETIC) {
        return jsonResponse;
      }
      if (
        jsonResponse &&
        Array.isArray(jsonResponse) &&
        jsonResponse.length > 0 &&
        (jsonResponse[0]?.title == "N/A" ||
          jsonResponse[0]?.title == undefined ||
          jsonResponse[0]?.title == "undefined")
      ) {
        throw new NetworkError(SUGGESTIONS_NOT_FOUND_ERROR, 400);
      }
      return jsonResponse;
    } catch (error) {
      throw new NetworkError(SUGGESTIONS_NOT_FOUND_ERROR, 400);
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
      aiToolUsageObj = {
        [`usedAITools.${data.ideaGenerationType}`]: true,
      };
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
    const placeholders = {
      problem: {
        problemTitle: problem.title,
        problemProducts: problem.products,
        problemPrice: problem.price,
        problemCustomer: problem.customer,
      },
      product: {
        productCustomerDescription: product.customer_description,
        problemCoreFeature: product.core_feature,
        problemExistingProducts: product.existing_products,
      },
      market: {
        hhiExplanation: market.hhi_score,
        tamExplanation: market.tam,
        cagrExplanation: market.cagr,
      },
    };
    try {
      return [
        {
          _id: IDEA_ANALYSIS.PROBLEM._id,
          name: IDEA_ANALYSIS.PROBLEM.name,
          rating: problem.average,
          slug: IDEA_ANALYSIS.PROBLEM.slug,
          analysis: [
            {
              name: IDEA_ANALYSIS.PROBLEM.trending.name,
              rating: problem.problemScore,
              description: replacePlaceholders(
                IDEA_ANALYSIS.PROBLEM.trending.description,
                placeholders.problem
              ),
              slug: IDEA_ANALYSIS.PROBLEM.trending.slug,
            },
            {
              name: IDEA_ANALYSIS.PROBLEM.wallet.name,
              rating: problem.priceRating,
              description: replacePlaceholders(
                IDEA_ANALYSIS.PROBLEM.wallet.description,
                placeholders.problem
              ),
              slug: IDEA_ANALYSIS.PROBLEM.wallet.slug,
            },
            {
              name: IDEA_ANALYSIS.PROBLEM.audience.name,
              rating: problem.customerRating,
              description: replacePlaceholders(
                IDEA_ANALYSIS.PROBLEM.audience.description,
                placeholders.problem
              ),
              slug: IDEA_ANALYSIS.PROBLEM.audience.slug,
            },
          ],
        },
        {
          _id: IDEA_ANALYSIS.PRODUCT._id,
          name: IDEA_ANALYSIS.PRODUCT.name,
          rating: product.average,
          slug: IDEA_ANALYSIS.PRODUCT.slug,
          analysis: [
            {
              name: IDEA_ANALYSIS.PRODUCT.niche.name,
              rating: product["customer_rating"],
              description: replacePlaceholders(
                IDEA_ANALYSIS.PRODUCT.niche.description,
                placeholders.product
              ),
              slug: IDEA_ANALYSIS.PRODUCT.niche.slug,
            },
            {
              name: IDEA_ANALYSIS.PRODUCT.feature.name,
              rating: product["core_feature_rating"],
              description: replacePlaceholders(
                IDEA_ANALYSIS.PRODUCT.feature.description,
                placeholders.product
              ),
              slug: IDEA_ANALYSIS.PRODUCT.feature.slug,
            },
            {
              name: IDEA_ANALYSIS.PRODUCT.differentiator.name,
              rating: product["product_rating"],
              description: replacePlaceholders(
                IDEA_ANALYSIS.PRODUCT.differentiator.description,
                placeholders.product
              ),
              slug: IDEA_ANALYSIS.PRODUCT.differentiator.slug,
            },
          ],
        },

        {
          _id: IDEA_ANALYSIS.MARKET._id,
          name: IDEA_ANALYSIS.MARKET.name,
          rating: market.average,
          slug: IDEA_ANALYSIS.MARKET.slug,
          analysis: [
            {
              name: IDEA_ANALYSIS.MARKET.hhi.name,
              rating: market.hhi_rating,
              description: replacePlaceholders(
                IDEA_ANALYSIS.MARKET.hhi.description,
                placeholders.market
              ),
              slug: IDEA_ANALYSIS.MARKET.hhi.slug,
            },
            {
              name: IDEA_ANALYSIS.MARKET.marketSize.name,
              rating: market.tam_rating,
              description: replacePlaceholders(
                IDEA_ANALYSIS.MARKET.marketSize.description,
                placeholders.market
              ),
              slug: IDEA_ANALYSIS.MARKET.marketSize.slug,
            },
            {
              name: IDEA_ANALYSIS.MARKET.marketGrowth.name,
              rating: market.cagr_rating,
              description: replacePlaceholders(
                IDEA_ANALYSIS.MARKET.marketGrowth.description,
                placeholders.market
              ),
              slug: IDEA_ANALYSIS.MARKET.marketGrowth.slug,
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
      const availableTokens = userExists.preLoadedCoins + userExists.quizCoins;
      if (availableTokens >= DEDUCT_RETRY_FUEL) {
        await UserTable.findOneAndUpdate(
          { _id: userExists._id },
          { $inc: { quizCoins: DEDUCT_RETRY_FUEL } },
          { upsert: true, new: true }
        );
      }
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }

  /**
   * @description this method will return the user input prompt corresponding to the AI Tool being used
   * @param businessProfile
   * @param idea
   * @param dependency
   * @param screenCopy
   * @param userAnswer
   * @param preload
   * @param key
   * @returns prompt
   */
  async getUserPrompt(
    businessProfile: any,
    idea: string,
    screenCopy: any,
    dependency: string[] = [],
    userAnswer: string = null,
    preload: boolean = false,
    key: string = null
  ) {
    try {
      let prompt = ``;
      for (const dep of dependency) {
        if (dep == "description") {
          prompt = `${prompt}\nBusiness Description: ${idea}`;
        } else {
          const depDetails = screenCopy.find((obj) => obj.key == dep);
          const hasGoalInCompletedActions = mapHasGoalKey(
            businessProfile?.completedActions,
            dep
          );
          /**
           * if a preload is triggered for any action and any dependency is not triggered, then return
           */
          if (preload && key) {
            const milestoneDetails = await MilestoneGoalsTable.aggregate([
              { $match: { key } },
              {
                $lookup: {
                  localField: "milestoneId",
                  foreignField: "_id",
                  from: "milestones",
                  as: "milestone",
                },
              },
              {
                $unwind: {
                  path: "$milestone",
                  preserveNullAndEmptyArrays: false,
                },
              },
              {
                $project: {
                  key: 1,
                  milestoneId: "$milestone._id",
                  order: "$milestone.order",
                },
              },
            ]);
            if (milestoneDetails[0]?.order >= 3 && !hasGoalInCompletedActions) {
              return false;
            }
          }
          if (depDetails?.name && hasGoalInCompletedActions) {
            prompt = `${prompt}\n${depDetails.name}: ${JSON.stringify(
              businessProfile.completedActions[dep]
            )}`;
          }
        }
      }
      if (userAnswer) {
        prompt = `${prompt}\nCommentary : ${userAnswer}}`;
      }
      if (!prompt.length) {
        prompt = `Business Description: ${idea}`;
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
        description,
        idea,
        completedActions = {},
        currentMilestone,
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
        currentMilestone,
      };

      const milestoneGoalsMap = new Map(
        milestoneGoals.map((goal) => [goal.key, goal])
      );
      const suggestionCopyMap = new Map(
        suggestionsScreenCopy.map((copy) => [copy.key, copy])
      );

      if (description) {
        const action = milestoneGoals.find(
          (goal) => goal.key == "ideaValidation"
        );
        businessProfile.businessPlans.push({
          _id: "description",
          key: "description",
          value: description,
          idea: idea,
          title: businessIdeaCopy.actionName,
          iconImage: action.iconImage,
          iconBackgroundColor: action.iconBackgroundColor,
          inputTemplate: {
            ...action.inputTemplate,
            suggestionScreenInfo: businessIdeaCopy,
          },
          template: action.template,
          name: businessIdeaCopy.name,
        });
      }

      Object.entries(completedActions)?.forEach(([key, value]) => {
        const action = milestoneGoalsMap.get(key);
        const actionCopy = suggestionCopyMap.get(key);
        if (action || key == "companyLogo") {
          const obj = {
            _id: key,
            key: key,
            value: value,
            title: actionCopy?.actionName,
            iconImage: action?.iconImage || "sparkles.webp",
            iconBackgroundColor: action?.iconBackgroundColor || "#FFFFFF29",
            inputTemplate: {
              ...action?.inputTemplate,
              suggestionScreenInfo: actionCopy,
            },
            template: action?.template || 3,
            name: actionCopy.name,
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
        return {
          ...obj,
          name: "Business Idea",
          key: "description",
          inputTemplate: {
            ...obj.inputTemplate,
            suggestionScreenInfo: {
              ...obj.inputTemplate?.suggestionScreenInfo,
              key: "description",
            },
          },
        };
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

  /**
   * @description this method will store Ai suggestions generated in DB, to reuse if the user kill the app after generating suggestions and come again next time
   * @param userExists
   * @param key
   * @param suggestions
   */
  async saveAIActionResponse(
    userExists: any,
    key: string,
    suggestions: any,
    ifOptionsAvailable: boolean = false,
    optionNumber: string = null
  ) {
    try {
      if (ifOptionsAvailable) {
        key = `${key}_${optionNumber}`;
      }
      await BusinessProfileTable.findOneAndUpdate(
        { userId: userExists._id },
        [
          {
            $set: {
              aiGeneratedSuggestions: {
                $ifNull: ["$aiGeneratedSuggestions", {}], // Initialize if null
              },
            },
          },
          {
            $set: {
              [`aiGeneratedSuggestions.${key}`]: suggestions, // Add nested field
            },
          },
        ],
        { upsert: true, new: true }
      );
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }
}
export default new BusinessProfileService();
