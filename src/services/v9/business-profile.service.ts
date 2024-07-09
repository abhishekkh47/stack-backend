import {
  BusinessProfileTable,
  UserTable,
  AIToolsUsageStatusTable,
  BusinessPassionTable,
  MarketSegmentInfoTable,
  ProblemScoreTable,
  MarketScoreTable,
} from "@app/model";
import { NetworkError } from "@app/middleware";
import {
  INVALID_DESCRIPTION_ERROR,
  SYSTEM_INPUT,
  BUSINESS_ACTIONS,
  IS_RETRY,
  REQUIRE_COMPANY_NAME,
  BACKUP_LOGOS,
  awsLogger,
  SYSTEM_IDEA_GENERATOR,
  SYSTEM_IDEA_VALIDATION,
  ANALYTICS_EVENTS,
} from "@app/utility";
import moment from "moment";
import { AnalyticsService } from "@app/services/v4";
import { BusinessProfileService as BusinessProfileServiceV7 } from "@app/services/v7";

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
    idea: string = null
  ) {
    try {
      let response = null;
      if (!idea) {
        throw new NetworkError(
          "Please provide a valid business description",
          404
        );
      }
      let aiToolUsageObj = {};
      aiToolUsageObj[key] = true;
      const prompt = `Business Name:${userBusinessProfile?.companyName}, Business Description: ${idea}`;
      const [textResponse, _] = await Promise.all([
        BusinessProfileServiceV7.generateTextSuggestions(
          SYSTEM_INPUT[BUSINESS_ACTIONS[key]],
          prompt
        ),
        AIToolsUsageStatusTable.findOneAndUpdate(
          { userId: userExists._id },
          { $set: aiToolUsageObj },
          { upsert: true }
        ),
      ]);
      response = JSON.parse(textResponse.choices[0].message.content);
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
        const prompt = `Business Name:${companyName}, Business Description: ${idea}`;
        const [textResponse, _] = await Promise.all([
          BusinessProfileServiceV7.generateTextSuggestions(
            SYSTEM_INPUT[BUSINESS_ACTIONS[key]],
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
   * @returns {*}
   */
  public async getBusinessHistory(businessHistory) {
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

        if (!acc[groupKey]) {
          acc[groupKey] = [];
        }

        acc[groupKey].push({
          key: entry.key,
          value: entry.value,
          timestamp: entry.timestamp,
          day: day,
        });
        return acc;
      }, {});

      let periodId = 0;
      const response = Object.entries(groupedHistory).map(
        ([key, values]: any) => {
          let order = 0;
          return {
            _id: ++periodId,
            title: key,
            data: values.map(({ key, value, day }) => ({
              _id: ++order,
              key: key,
              details: value,
              date: day,
            })),
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
   * @param key
   * @param businessType
   * @returns {*}
   */
  public async generateBusinessIdea(
    prompt: string,
    key: string,
    businessType: number
  ) {
    try {
      let aiToolUsageObj = {};
      aiToolUsageObj[key] = true;
      const marketSelectionData = await this.getFormattedSuggestions(
        SYSTEM_IDEA_GENERATOR.PROBLEM_MARKET_SELECTOR,
        prompt
      );
      const systemInputDataset =
        Number(businessType) === 1
          ? SYSTEM_IDEA_GENERATOR.PHYSICAL_PRODUCT
          : SYSTEM_IDEA_GENERATOR.SOFTWARE_TECHNOLOGY;
      const updatedPrompt = `${marketSelectionData.problem}\n ${marketSelectionData.market}`;
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

      const [problemAnalysisData, marketAnalysisData, productAnalysisData] =
        await Promise.all([
          ProblemScoreTable.find({
            problem: {
              $in: [
                productizationData.problem,
                distributionData.problem,
                dominateNicheData.problem,
              ],
            },
            type: businessType,
          }),
          MarketScoreTable.find({
            marketSegment: {
              $in: [
                productizationData.market,
                distributionData.market,
                dominateNicheData.market,
              ],
            },
            type: businessType,
          }),
          this.getFormattedSuggestions(
            SYSTEM_IDEA_GENERATOR.PRODUCT_RATING,
            updatedPrompt
          ),
        ]);

      let order = 0;
      productizationData["ideaLabel"] = "Best Product";
      distributionData["ideaLabel"] = "Most Innovative";
      dominateNicheData["ideaLabel"] = "Best Market";
      [productizationData, distributionData, dominateNicheData].map((data) => {
        data["_id"] = `idea${++order}`;
        const problem = problemAnalysisData.find(
          (obj) => obj.problem == data.problem
        );
        const market = marketAnalysisData.find(
          (obj) => obj.marketSegment == data.market
        );
        data["rating"] = Math.floor(
          (problem.overallRating +
            market.overallRating +
            productAnalysisData["Overall Score"]) /
            3
        );
        data["ideaAnalysis"] = [];

        data["ideaAnalysis"].push({
          _id: "problem",
          name: "Problem Analysis",
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
        });

        data["ideaAnalysis"].push({
          _id: "product",
          name: "Product Analysis",
          rating: Math.floor(Number(productAnalysisData["Overall Score"])),
          analysis: [
            {
              name: "Niche Audience",
              rating: productAnalysisData["Audience Focus Score"],
              description: productAnalysisData.audienceFocusScoreDescription,
            },
            {
              name: "Core Features",
              rating: productAnalysisData["Sophistication Score"],
              description: productAnalysisData.sophisticationDescription,
            },
            {
              name: "Differentiation",
              rating: productAnalysisData["Unique Score"],
              description: productAnalysisData.uniqueScoreDescription,
            },
          ],
        });

        data["ideaAnalysis"].push({
          _id: "market",
          name: "Market Analysis",
          rating: market.overallRating,
          analysis: [
            {
              name: "HHI",
              rating: market.hhiRating,
              description: market.hhiExplanation,
            },
            {
              name: "CR4 + CR10",
              rating: 94,
              description:
                "The full business description should always be three lines or less. so at most it should look something like this.",
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
        });
      });
      return {
        ideas: [productizationData, distributionData, dominateNicheData],
      };
    } catch (error) {
      throw new NetworkError(INVALID_DESCRIPTION_ERROR, 400);
    }
  }

  /**
   * @description this will validate user provided business idea using OpenAI GPT
   * @param prompt
   * @param key
   * @returns {*}
   */
  public async ideaValidator(prompt: string, key: string) {
    try {
      let aiToolUsageObj = {};
      aiToolUsageObj[key] = true;

      const businessIdeaType = await this.getFormattedSuggestions(
        SYSTEM_IDEA_VALIDATION.BUSINESS_TYPE_SELECTOR,
        prompt
      );
      const businessType = businessIdeaType === "ecommerce" ? 1 : 2;
      const systemInputDataset =
        businessType === 1
          ? SYSTEM_IDEA_VALIDATION.PHYSICAL_PRODUCT
          : SYSTEM_IDEA_VALIDATION.TECH_PRODUCT;
      let validatedIdea = await this.getFormattedSuggestions(
        systemInputDataset,
        prompt
      );

      const updatedPrompt = `${validatedIdea.problem}\n ${validatedIdea.market}`;
      const [problemAnalysisData, marketAnalysisData, productAnalysisData] =
        await Promise.all([
          ProblemScoreTable.find({
            problem: {
              $in: [validatedIdea.problem],
            },
            type: businessType,
          }),
          MarketScoreTable.find({
            marketSegment: {
              $in: [validatedIdea.market],
            },
            type: businessType,
          }),
          this.getFormattedSuggestions(
            SYSTEM_IDEA_VALIDATION.PRODUCT_RATING,
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
      validatedIdea["ideaLabel"] = "Your Idea";
      validatedIdea["rating"] = Math.floor(
        (problem.overallRating +
          market.overallRating +
          productAnalysisData["Overall Score"]) /
          3
      );
      validatedIdea["ideaAnalysis"] = [];

      validatedIdea["ideaAnalysis"].push({
        _id: "problem",
        name: "Problem Analysis",
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
      });

      validatedIdea["ideaAnalysis"].push({
        _id: "product",
        name: "Product Analysis",
        rating: Math.floor(Number(productAnalysisData["Overall Score"])),
        analysis: [
          {
            name: "Niche Audience",
            rating: productAnalysisData["Audience Focus Score"],
            description: productAnalysisData.audienceFocusScoreDescription,
          },
          {
            name: "Core Features",
            rating: productAnalysisData["Sophistication Score"],
            description: productAnalysisData.sophisticationDescription,
          },
          {
            name: "Differentiation",
            rating: productAnalysisData["Unique Score"],
            description: productAnalysisData.uniqueScoreDescription,
          },
        ],
      });

      validatedIdea["ideaAnalysis"].push({
        _id: "market",
        name: "Market Analysis",
        rating: market.overallRating,
        analysis: [
          {
            name: "HHI",
            rating: market.hhiRating,
            description: market.hhiExplanation,
          },
          {
            name: "CR4 + CR10",
            rating: 94,
            description:
              "The full business description should always be three lines or less. so at most it should look something like this.",
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
      });

      let suggestions = (
        await this.generateBusinessIdea(prompt, key, businessType)
      ).ideas;

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
      return JSON.parse(
        response.choices[0].message.content.replace(/```json|```/g, "").trim()
      );
    } catch (error) {
      throw new NetworkError(INVALID_DESCRIPTION_ERROR, 400);
    }
  }

  /**
   * @description this method will update the Idea Generator usage status used while onboarding
   * @param userExists
   * @param key
   * @param idea
   * @param data
   * @returns {*}
   */
  public async onboardingIdeaUpdate(
    userExists: any,
    key: string,
    idea: string,
    data: string
  ) {
    try {
      let aiToolUsageObj = {};
      aiToolUsageObj[key] = true;
      if (userExists && userExists._id && idea) {
        AIToolsUsageStatusTable.findOneAndUpdate(
          { userId: userExists._id },
          { $set: aiToolUsageObj },
          { upsert: true }
        );
        AnalyticsService.sendEvent(
          ANALYTICS_EVENTS.BUSINESS_IDEA_SUBMITTED,
          { "Item Name": idea },
          { user_id: userExists._id }
        );
      }

      if (userExists && userExists._id && data) {
        BusinessProfileServiceV7.addOrEditBusinessProfile(data, userExists, []);
      }
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }
}
export default new BusinessProfileService();
