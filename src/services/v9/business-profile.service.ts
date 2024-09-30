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
  PRODUCT_TYPE,
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
    isRetry: string = IS_RETRY.FALSE
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
      aiToolUsageObj = { [`usedAITools.${key}`]: true };
      const [systemDataset, goalDetails, suggestionsScreenCopy, datasetTypes] =
        await Promise.all([
          AIToolDataSetTable.findOne({ key }).lean(),
          MilestoneGoalsTable.findOne({ key }).lean(),
          SuggestionScreenCopyTable.find().lean(),
          AIToolDataSetTypesTable.findOne({ key }).lean(),
        ]);
      const prompt = this.getUserPrompt(
        userBusinessProfile,
        idea,
        goalDetails?.dependency,
        suggestionsScreenCopy,
        answerOfTheQuestion
      );
      let systemInput: any = systemDataset.data;
      if (type && typeof systemInput == "object") {
        systemInput = systemInput[datasetTypes.types[type]];
      }
      const response = await this.getFormattedSuggestions(
        systemInput,
        prompt,
        key
      );
      if (response) {
        await AIToolsUsageStatusTable.findOneAndUpdate(
          { userId: userExists._id },
          { $set: aiToolUsageObj },
          { upsert: true }
        );
      }
      if (response && !userExists.isPremiumUser && isRetry == IS_RETRY.TRUE) {
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
      const businessType = 2; // Only tech product
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
          ideaGenerator[IDEA_GENERATOR_INFO.PROBLEM_GENERATOR],
          idea.businessDescription
        )
      );

      const ratingPromises = ideaResults.map((idea) =>
        this.getFormattedSuggestions(
          softwareTechnology[IDEA_GENERATOR_INFO.PRODUCT_RATING],
          idea.businessDescription
        )
      );

      const marketPromises = ideaResults.map((idea) =>
        this.getFormattedSuggestions(
          softwareTechnology[IDEA_GENERATOR_INFO.PROBLEM_MARKET_SELECTOR],
          idea.businessDescription
        )
      );

      // Fetch problem, rating, and market suggestions in parallel
      const [problemResults, ratingResults, marketResults] = await Promise.all([
        Promise.all(problemPromises),
        Promise.all(ratingPromises),
        Promise.all(marketPromises),
      ]);

      const marketSegments = marketResults.map((market) =>
        market.market.replace(/\.$/, "")
      );
      const [
        marketAnalysisData,
        productizationData,
        distributionData,
        dominateNicheData,
      ] = await Promise.all([
        MarketScoreTable.find({
          marketSegment: {
            $in: marketSegments,
          },
          type: businessType,
        }).lean(),
        this.getFormattedSuggestions(
          softwareTechnology[IDEA_GENERATOR_INFO.PRODUCTIZATION.name],
          marketResults[0].market
        ),
        this.getFormattedSuggestions(
          softwareTechnology[IDEA_GENERATOR_INFO.DISTRIBUTION.name],
          marketResults[1].market
        ),
        this.getFormattedSuggestions(
          softwareTechnology[IDEA_GENERATOR_INFO.DOMINATE_NICHE.name],
          marketResults[2].market
        ),
      ]);

      let order = 0;
      const ideasData = [
        {
          data: productizationData,
          problem: problemResults[0],
          label: softwareTechnology[IDEA_GENERATOR_INFO.PRODUCTIZATION.label],
          imageKey: IDEA_GENERATOR_INFO.PRODUCTIZATION.image,
          ratingData: ratingResults[0],
          marketData: marketResults[0],
        },
        {
          data: distributionData,
          problem: problemResults[1],
          label: softwareTechnology[IDEA_GENERATOR_INFO.DISTRIBUTION.label],
          imageKey: IDEA_GENERATOR_INFO.DISTRIBUTION.image,
          ratingData: ratingResults[1],
          marketData: marketResults[1],
        },
        {
          data: dominateNicheData,
          problem: problemResults[2],
          label: softwareTechnology[IDEA_GENERATOR_INFO.DOMINATE_NICHE.label],
          imageKey: IDEA_GENERATOR_INFO.DOMINATE_NICHE.image,
          ratingData: ratingResults[2],
          marketData: marketResults[2],
        },
      ];
      const BUSINESS_IDEA_IMAGES_BY_TYPE = BUSINESS_IDEA_IMAGES.TECH_PRODUCT;
      const ideas = ideasData.map(
        ({ data, problem, label, imageKey, ratingData, marketData }) => {
          data.ideaLabel = label;
          data.image = BUSINESS_IDEA_IMAGES_BY_TYPE[imageKey];
          data._id = `idea${++order}`;

          const market = marketAnalysisData.find(
            (obj) => obj.marketSegment === marketData.market.replace(/\.$/, "")
          );

          data.rating = Math.floor(
            (Number(problem.average) +
              market.overallRating +
              ratingData["Overall Score"]) /
              3
          );
          data.ideaAnalysis = this.ideaAnalysis(problem, ratingData, market);

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
      const systemInputDataset = await AIToolDataSetTable.find({
        key: {
          $in: [
            IDEA_GENERATOR_INFO.IDEA_VALIDATION,
            IDEA_GENERATOR_INFO.IDEA_GENERATOR,
          ],
        },
      }).lean();

      const ideaGenerator = systemInputDataset.find(
        (obj) => obj.key == IDEA_GENERATOR_INFO.IDEA_GENERATOR
      )?.data;
      const ideaValidationDataset = systemInputDataset.find(
        (obj) => obj.key == IDEA_GENERATOR_INFO.IDEA_VALIDATION
      )?.data;

      let validatedIdea = await this.getFormattedSuggestions(
        ideaValidationDataset[IDEA_GENERATOR_INFO.TECH_PRODUCT],
        prompt
      );

      const updatedPrompt = `${validatedIdea.problem}\n ${validatedIdea.market}`;
      const [problemAnalysisData, marketAnalysisData, productAnalysisData] =
        await Promise.all([
          this.getFormattedSuggestions(
            ideaGenerator[IDEA_GENERATOR_INFO.PROBLEM_GENERATOR],
            validatedIdea.description
          ),
          MarketScoreTable.find({
            marketSegment: validatedIdea.market,
            type: PRODUCT_TYPE.Software,
          }),
          this.getFormattedSuggestions(
            ideaValidationDataset[IDEA_GENERATOR_INFO.PRODUCT_RATING],
            updatedPrompt
          ),
        ]);

      const market = marketAnalysisData.find(
        (obj) => obj.marketSegment == validatedIdea.market
      );

      validatedIdea["_id"] = "selfIdea";
      validatedIdea["ideaLabel"] =
        ideaValidationDataset["IDEA_VALIDATION_LABEL"];
      validatedIdea["rating"] = Math.floor(
        (Number(problemAnalysisData.average) +
          market.overallRating +
          productAnalysisData["Overall Score"]) /
          3
      );
      validatedIdea["ideaAnalysis"] = this.ideaAnalysis(
        problemAnalysisData,
        productAnalysisData,
        market
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
    const problemPlaceHolders = {
      problemTitle: problem.title,
      problemProducts: problem.products,
      problemPrice: problem.price,
      problemCustomer: problem.customer,
    };
    try {
      return [
        {
          _id: IDEA_ANALYSIS.PROBLEM._id,
          name: IDEA_ANALYSIS.PROBLEM.name,
          rating: problem.average,
          analysis: [
            {
              name: IDEA_ANALYSIS.PROBLEM.trending.name,
              rating: problem.problemScore,
              description: replacePlaceholders(
                IDEA_ANALYSIS.PROBLEM.trending.description,
                problemPlaceHolders
              ),
            },
            {
              name: IDEA_ANALYSIS.PROBLEM.wallet.name,
              rating: problem.priceRating,
              description: replacePlaceholders(
                IDEA_ANALYSIS.PROBLEM.wallet.description,
                problemPlaceHolders
              ),
            },
            {
              name: IDEA_ANALYSIS.PROBLEM.audience.name,
              rating: problem.customerRating,
              description: replacePlaceholders(
                IDEA_ANALYSIS.PROBLEM.audience.description,
                problemPlaceHolders
              ),
            },
          ],
        },
        {
          _id: IDEA_ANALYSIS.PRODUCT._id,
          name: IDEA_ANALYSIS.PRODUCT.name,
          rating: Math.floor(Number(product["Overall Score"])),
          analysis: [
            {
              name: IDEA_ANALYSIS.PRODUCT.niche,
              rating: product["Audience Focus Score"],
              description: product.audienceFocusScoreDescription,
            },
            {
              name: IDEA_ANALYSIS.PRODUCT.feature,
              rating: product["Sophistication Score"],
              description: product.sophisticationDescription,
            },
            {
              name: IDEA_ANALYSIS.PRODUCT.differentiator,
              rating: product["Unique Score"],
              description: product.uniqueScoreDescription,
            },
          ],
        },

        {
          _id: IDEA_ANALYSIS.MARKET._id,
          name: IDEA_ANALYSIS.MARKET.name,
          rating: market.overallRating,
          analysis: [
            {
              name: IDEA_ANALYSIS.MARKET.hhi,
              rating: market.hhiRating,
              description: market.hhiExplanation,
            },
            {
              name: IDEA_ANALYSIS.MARKET.satisfaction,
              rating: market.customerSatisfactionRating,
              description: market.customerSatisfactionExplanation,
            },
            {
              name: IDEA_ANALYSIS.MARKET.industryAge,
              rating: market.ageIndexRating,
              description: market.ageIndexExplanation,
            },
            {
              name: IDEA_ANALYSIS.MARKET.marketSize,
              rating: market.tamRating,
              description: market.tamExplanation,
            },
            {
              name: IDEA_ANALYSIS.MARKET.marketGrowth,
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
   * @param idea
   * @param dependency
   * @param screenCopy
   * @param userAnswer
   * @returns prompt
   */
  getUserPrompt(
    businessProfile: any,
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
          const hasGoalInCompletedActions = mapHasGoalKey(
            businessProfile?.completedActions,
            dependency[i]
          );
          if (depDetails?.name && hasGoalInCompletedActions) {
            prompt = `${prompt}\n${depDetails.name}: ${JSON.stringify(
              businessProfile.completedActions[dependency[i]]
            )}`;
          }
        }
      }
      if (userAnswer) {
        prompt = `${prompt}\nCommentary : ${userAnswer}}`;
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
}
export default new BusinessProfileService();
