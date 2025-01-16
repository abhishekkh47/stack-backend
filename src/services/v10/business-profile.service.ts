import { QuizLevelTable, MilestoneGoalsTable } from "@app/model";
import { NetworkError } from "@app/middleware";
import {
  IS_RETRY,
  SUGGESTIONS_NOT_FOUND_ERROR,
  QUIZ_TYPE,
  PRELOAD,
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
              } else {
                BusinessProfileServiceV9.generateAISuggestions(
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
}
export default new BusinessProfileService();
