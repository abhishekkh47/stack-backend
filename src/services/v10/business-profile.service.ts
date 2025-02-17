import {
  QuizLevelTable,
  MilestoneGoalsTable,
  AIToolDataSetTable,
  SuggestionScreenCopyTable,
  AIToolDataSetTypesTable,
} from "@app/model";
import { NetworkError } from "@app/middleware";
import {
  IS_RETRY,
  SUGGESTIONS_NOT_FOUND_ERROR,
  QUIZ_TYPE,
  PRELOAD,
  DEDUCT_RETRY_FUEL,
  REQUIRE_COMPANY_NAME,
  TARGET_AUDIENCE_REQUIRED,
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
    isRetry: string = IS_RETRY.FALSE,
    preload: boolean = false
  ) {
    try {
      let response = null,
        ifOptionsAvailable = false;
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
        // if ai suggestions already available, return response
        response = userBusinessProfile?.aiGeneratedSuggestions?.[key];
      } else if (
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
          key
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
        if (type && typeof systemInput == "object") {
          ifOptionsAvailable = true;
          systemInput = systemInput[datasetTypes.types[type]];
        }
        /**
         * generate suggestions using the OpenAi API
         * and get the clean json format response
         */
        response = await BusinessProfileServiceV9.getFormattedSuggestions(
          systemInput,
          prompt,
          key
        );
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
          if (!isPremiumUser && isRetry == IS_RETRY.TRUE) {
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
        IS_RETRY.FALSE,
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
}
export default new BusinessProfileService();
