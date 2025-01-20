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
      if (!userBusinessProfile.description) {
        return;
      }
      const quizDetails = await QuizLevelTable.findOne({
        "actions.quizId": quizId,
      });
      if (quizDetails.actions[1].type == QUIZ_TYPE.STORY) {
        const milestoneId = quizDetails?.milestoneId;
        const day = quizDetails?.day;
        if (milestoneId && day) {
          const goals = await MilestoneGoalsTable.find({ milestoneId, day });
          goals.map(async (goal) => {
            if (!userBusinessProfile?.aiGeneratedSuggestions?.[goal.key]) {
              const options = goal?.inputTemplate?.optionsScreenInfo?.options;
              if (options) {
                options.forEach((option) => {
                  this.generateAISuggestions(
                    userExists,
                    goal.key,
                    userBusinessProfile,
                    userBusinessProfile.description,
                    `${option.type}`,
                    null,
                    IS_RETRY.FALSE,
                    PRELOAD.TRUE
                  );
                });
              } else {
                this.generateAISuggestions(
                  userExists,
                  goal.key,
                  userBusinessProfile,
                  userBusinessProfile.description,
                  "1",
                  null,
                  IS_RETRY.FALSE,
                  PRELOAD.TRUE
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
        response = userBusinessProfile?.aiGeneratedSuggestions?.[key];
      } else if (
        userBusinessProfile?.aiGeneratedSuggestions?.[`${key}_${type}`] != null
      ) {
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
        if (type && typeof systemInput == "object") {
          ifOptionsAvailable = true;
          systemInput = systemInput[datasetTypes.types[type]];
        }
        response = await BusinessProfileServiceV9.getFormattedSuggestions(
          systemInput,
          prompt,
          key
        );
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
}
export default new BusinessProfileService();
