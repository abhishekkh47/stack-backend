import {
  QuizLevelTable,
  MilestoneGoalsTable,
  AIToolDataSetTable,
  SuggestionScreenCopyTable,
  AIToolDataSetTypesTable,
  AIToolsUsageStatusTable,
} from "@app/model";
import { NetworkError } from "@app/middleware";
import {
  SUGGESTIONS_NOT_FOUND_ERROR,
  QUIZ_TYPE,
  PRELOAD,
  DEDUCT_RETRY_FUEL,
  REQUIRE_COMPANY_NAME,
  TARGET_AUDIENCE_REQUIRED,
  LEVEL1_KEYS,
  AI_MODELS,
  FINE_TUNE_PROMPTS,
} from "@app/utility";
import { BusinessProfileService as BusinessProfileServiceV9 } from "@app/services/v9";
class BusinessProfileService {
  /**
   * @description this will generate business idea using OpenAI GPT
   * @param userExists
   * @param userBusinessProfile
   * @param quizId
   * @returns {*}
   */
  public async preLoadAISuggestions(
    userExists: any,
    userBusinessProfile: any,
    quizId: any
  ) {
    try {
      /**
       * If the business description is not available,
       * we cannot generate any ai suggestions
       */
      if (!userBusinessProfile.description) {
        return;
      }
      /**
       * get the quiz info to check the quiz type
       */
      const quizDetails = await QuizLevelTable.findOne({
        "actions.quizId": quizId,
      });
      /**
       * if the quiz type = story, then start generating the AI Suggestions
       */
      if (quizDetails.actions[1].type == QUIZ_TYPE.STORY) {
        const milestoneId = quizDetails?.milestoneId;
        const day = quizDetails?.day;
        if (milestoneId && day) {
          // get the ai actions for which suggestions need to be generated
          const goals = await MilestoneGoalsTable.find({ milestoneId, day });
          goals.map(async (goal) => {
            if (!userBusinessProfile?.aiGeneratedSuggestions?.[goal.key]) {
              // check if the ai action has multiple options before generating the ai suggestions
              const options = goal?.inputTemplate?.optionsScreenInfo?.options;
              if (options) {
                options.forEach((option) => {
                  this.retryGenerateAISuggestions(
                    userExists,
                    goal.key,
                    userBusinessProfile,
                    userBusinessProfile.description,
                    `${option.type}`
                  );
                });
              } else {
                this.retryGenerateAISuggestions(
                  userExists,
                  goal.key,
                  userBusinessProfile,
                  userBusinessProfile.description,
                  "1"
                );
              }
            }
          });
        }
      }
    } catch (error) {
      throw new NetworkError(SUGGESTIONS_NOT_FOUND_ERROR, 400);
    }
  }

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
    isRetry: boolean = false,
    preload: boolean = false,
    userInput: string = null
  ) {
    try {
      let response = null,
        ifOptionsAvailable = false,
        model = null;
      if (!idea) {
        throw new NetworkError(
          "Please provide a valid business description",
          404
        );
      }
      const availableTokens = userExists.preLoadedCoins + userExists.quizCoins;
      const isPremiumUser = userExists.isPremiumUser;
      if (
        isPremiumUser &&
        isRetry == true &&
        availableTokens < DEDUCT_RETRY_FUEL
      ) {
        throw new NetworkError("Not enough tokens available", 404);
      }
      if (
        !isRetry &&
        userBusinessProfile?.aiGeneratedSuggestions?.[key] != null &&
        !userInput
      ) {
        // if ai suggestions already available, return response
        response = userBusinessProfile?.aiGeneratedSuggestions?.[key];
      } else if (
        !isRetry &&
        !userInput &&
        !LEVEL1_KEYS.includes(key) &&
        userBusinessProfile?.aiGeneratedSuggestions?.[`${key}_${type}`] != null
      ) {
        /**
         * In case where ai actions have multiple options,
         * the saved response is in format - key_type
         * if existing suggestions available for selected type, return response
         */
        response =
          userBusinessProfile?.aiGeneratedSuggestions?.[`${key}_${type}`];
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
                bestPractice: 1,
                scoringCriteria: "$scoringCriteria.scoringCriteria",
              },
            },
          ]).exec(),
          SuggestionScreenCopyTable.find().lean(),
          AIToolDataSetTypesTable.findOne({ key }).lean(),
        ]);
        // generate user prompt for the selected ai action
        const prompt = await BusinessProfileServiceV9.getUserPrompt(
          userBusinessProfile,
          idea,
          suggestionsScreenCopy,
          goalDetails[0]?.dependency,
          answerOfTheQuestion,
          preload,
          key,
          userInput
        );
        /**
         * If any dependency is not resolved, then return
         */
        if (!prompt) {
          return;
        }
        let systemInput: any = systemDataset.data;
        /**
         * If the type of systemInput is object, it means that the ai action contains some options
         * So we need to generate suggestions for the given type
         */
        if (LEVEL1_KEYS.includes(key)) {
          systemInput = FINE_TUNE_PROMPTS[key].name;
          model = AI_MODELS[key].name;
        } else if (type && typeof systemInput == "object") {
          ifOptionsAvailable = true;
          systemInput = systemInput[datasetTypes.types[type]];
        }

        if (LEVEL1_KEYS.includes(key)) {
          const { description, bestPractice } =
            await BusinessProfileServiceV9.getFormattedSuggestions(
              systemInput,
              prompt,
              key,
              model,
              true
            );
          // const description = JSON.stringify(response);
          response = await this.getActionRatings(key, description, prompt);
          response[0]["description"] = description;
          response[0]["bestPractice"] = bestPractice;
        } else {
          /**
           * generate suggestions using the OpenAi API
           * and get the clean json format response
           */
          response = await BusinessProfileServiceV9.getFormattedSuggestions(
            systemInput,
            prompt,
            key,
            model
          );
        }
        // sort the suggestions in the alphabetical order of their title
        response?.sort((a, b) => a?.title?.localeCompare(b?.title));
        const scoringCriteria = goalDetails[0]?.scoringCriteria[type];
        response.forEach((obj) => {
          /**
           * Each cirteria of each suggestion should be categorized under stregth and weakness
           * which is done based on below conditions
           */
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
        /**
         * if the response is generated correctly ,
         * save that to business profile collection to use afterwards
         */
        if (response) {
          BusinessProfileServiceV9.saveAIActionResponse(
            userExists,
            key,
            response,
            ifOptionsAvailable,
            type
          );
          this.updateAIToolUsageStatus(userExists, key);
          if (isPremiumUser && isRetry) {
            await BusinessProfileServiceV9.updateAIToolsRetryStatus(userExists);
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
   * @description this will generate business idea using OpenAI GPT
   * @param userExists
   * @param key ai action key
   * @param userBusinessProfile
   * @param description user input to generate business logo
   * @param optionType option for which suggestion to be generated
   * @param retryCount retry count
   * @returns {*}
   */
  private async retryGenerateAISuggestions(
    userExists: any,
    key: string,
    userBusinessProfile: any,
    description: string,
    optionType: string,
    retryCount: number = 0
  ): Promise<void> {
    try {
      await this.generateAISuggestions(
        userExists,
        key,
        userBusinessProfile,
        description,
        optionType,
        null,
        false,
        PRELOAD.TRUE
      );
    } catch (error) {
      /**
       * if error occur while generating suggestions,
       * recursively call the retryGenerateAISuggestions function with a retryCount param
       * and stop when retryCount reach 3
       */
      if (retryCount < 3) {
        console.warn(
          `Retrying generateAISuggestions for action: ${key}. Attempt ${
            retryCount + 1
          }`
        );
        await this.retryGenerateAISuggestions(
          userExists,
          key,
          userBusinessProfile,
          description,
          optionType,
          retryCount + 1
        );
      } else {
        console.error(
          `Failed to generate AI suggestions for action: ${key} after 3 attempts. Error: `,
          error
        );
      }
    }
  }

  /**
   * @description this will get the highest rated suggestion
   * @param response Array of suggestions from openAi
   * @param key ai action key
   * @param isNew boolean to check if the suggestion is newly generated
   * @returns {*}
   */
  private async getBestSuggestion(
    response: any,
    key: string,
    isNew: boolean = false
  ) {
    const bestSuggestion = response.reduce((max, current) => {
      return current.overallScore > max.overallScore ? current : max;
    });
    /**
     * if there are existing suggestions but the bestPractice field do not exists,
     * then only get the bestPractice details for the given action
     */
    if (!isNew && !response[0]?.bestPractice) {
      const bestPractice = await MilestoneGoalsTable.findOne({ key });
      bestSuggestion[
        "bestPractice"
      ] = `Choose a business name that:\nRelates to your product/business\nIs easy to say and spell across cultures\nIs unique amongst competitors`;
    }
    return [bestSuggestion];
  }

  /**
   * @description this will update AI tools usage status for the given key
   * @param userExists
   * @param key ai action key
   * @returns {*}
   */
  async updateAIToolUsageStatus(userExists: any, key: string) {
    const aiToolUsageObj = { [`usedAITools.${key}`]: true };
    await AIToolsUsageStatusTable.findOneAndUpdate(
      { userId: userExists._id },
      { $set: aiToolUsageObj },
      { upsert: true }
    );
  }

  /**
   * @description this is to get ratings for the generated fine tuned suggestion
   * @param key ai action key
   * @param suggestion
   * @param prompt
   * @returns {*}
   */
  async getActionRatings(key: string, suggestion: string, prompt: string) {
    const systemInput = FINE_TUNE_PROMPTS[key].ratings;
    const model = AI_MODELS[key].ratings;
    prompt = `${suggestion} - ${prompt}`;
    const ratings = await BusinessProfileServiceV9.getFormattedSuggestions(
      systemInput,
      prompt,
      key,
      model
    );
    return ratings;
  }
}
export default new BusinessProfileService();
