import BaseController from "@app/controllers/base";
import { Auth, PrimeTrustJWT } from "@app/middleware";
import {
  BusinessProfileTable,
  LeagueTable,
  QuizResult,
  QuizTable,
  UserTable,
  WeeklyJourneyTable,
} from "@app/model";
import { zohoCrmService } from "@app/services/v1";
import {
  LeagueService,
  QuizDBService as QuizDBServiceV4,
  UserDBService,
} from "@app/services/v4";
import { QuizDBService, BusinessProfileService } from "@app/services/v7";
import { HttpMethod } from "@app/types";
import { Route, SUGGESTION_FORMAT, IS_RETRY } from "@app/utility";
import { validation } from "@app/validations/v1/apiValidation";

class QuizController extends BaseController {
  /**
   * @description This method is used to post current quiz results
   * @param ctx
   * @return {*}
   */
  @Route({ path: "/quiz-results", method: HttpMethod.POST })
  @Auth()
  @PrimeTrustJWT(true)
  public storeQuizResults(ctx: any) {
    const reqParam = ctx.request.body;
    const { user, headers } = ctx.request;
    return validation.addQuizResultValidation(
      reqParam,
      ctx,
      async (validate) => {
        if (validate) {
          const [
            leagues,
            userIfExists,
            quizIfExists,
            quizResultsIfExists,
            curentWeeklyJourneyDetails,
            userBusinessProfile,
          ] = await Promise.all([
            LeagueTable.find({})
              .select("_id name image minPoint maxPoint colorCode")
              .sort({ minPoint: 1 }),
            UserTable.findOne({ _id: user._id }).populate("streakGoal"),
            QuizTable.findOne({ _id: reqParam.quizId }),
            QuizResult.findOne({ userId: user._id, quizId: reqParam.quizId }),
            WeeklyJourneyTable.findOne({
              _id: reqParam.weeklyJourneyId,
            }).lean(),
            BusinessProfileTable.findOne({ userId: user._id }),
          ]);
          if (!userIfExists) {
            return this.BadRequest(ctx, "User Not Found");
          }
          if (!quizIfExists) {
            return this.BadRequest(ctx, "Quiz Details Doesn't Exists");
          }
          if (quizResultsIfExists) {
            return this.BadRequest(
              ctx,
              "You cannot submit the same quiz again"
            );
          }
          /*
           * If the upcoming action is to upload company logo
           * we will generate the logo using midjourney from here
           * and store them in DB
           */

          if (
            curentWeeklyJourneyDetails.week == 1 &&
            curentWeeklyJourneyDetails.day == 2 &&
            curentWeeklyJourneyDetails.actions[0].quizId == reqParam.quizId
          ) {
            BusinessProfileService.generateAILogos(
              userIfExists,
              "companyLogo",
              userBusinessProfile,
              IS_RETRY.FALSE,
              null,
              true,
              IS_RETRY.FALSE
            );
          }
          const {
            totalXPPoints,
            updatedXPPoints,
            totalFuel,
            isGiftedStreakFreeze,
            updatedUser,
          } = await QuizDBService.storeQuizInformation(
            userIfExists,
            headers,
            reqParam,
            quizIfExists
          );
          const [
            { previousLeague, currentLeague, nextLeague, isNewLeagueUnlocked },
            streaksDetails,
          ] = await Promise.all([
            LeagueService.getUpdatedLeagueDetailsOfUser(
              userIfExists,
              leagues,
              updatedXPPoints
            ),
            UserDBService.addStreaks(updatedUser),
          ]);

          (async () => {
            QuizDBServiceV4.getQuizDataForCrm(
              updatedUser,
              user._id,
              updatedXPPoints
            )
              .then((dataForCrm) => {
                zohoCrmService.addAccounts(
                  ctx.request.zohoAccessToken,
                  dataForCrm,
                  true
                );
              })
              .catch((err) => console.log("ERROR : ", err));
          })();
          return this.Ok(ctx, {
            message: "Quiz Results Stored Successfully",
            totalXPPoints: totalXPPoints,
            totalFuel,
            updatedXPPoints,
            previousLeague,
            currentLeague,
            nextLeague,
            isNewLeagueUnlocked,
            streaksDetails,
            isGiftedStreakFreeze,
          });
        }
      }
    );
  }
}

export default new QuizController();
