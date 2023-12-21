import BaseController from "@app/controllers/base";
import { Auth, PrimeTrustJWT } from "@app/middleware";
import { LeagueTable, QuizResult, QuizTable, UserTable } from "@app/model";
import { zohoCrmService } from "@app/services/v1";
import {
  LeagueService,
  QuizDBService as QuizDBServiceV4,
  UserDBService,
} from "@app/services/v4";
import { QuizDBService } from "@app/services/v7";
import { HttpMethod } from "@app/types";
import { Route } from "@app/utility";
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
          const [leagues, userIfExists, quizIfExists, quizResultsIfExists] =
            await Promise.all([
              LeagueTable.find({})
                .select("_id name image minPoint maxPoint colorCode")
                .sort({ minPoint: 1 }),
              UserTable.findOne({ _id: user._id }).populate("streakGoal"),
              QuizTable.findOne({ _id: reqParam.quizId }),
              QuizResult.findOne({ userId: user._id, quizId: reqParam.quizId }),
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
          const {
            totalXPPoints,
            updatedXPPoints,
            totalFuel,
            isGiftedStreakFreeze,
          } = await QuizDBService.storeQuizInformation(
            userIfExists,
            headers,
            reqParam,
            quizIfExists
          );
          const [
            { previousLeague, currentLeague, nextLeague, isNewLeagueUnlocked },
            streaksDetails,
            quizRecommendations,
          ] = await Promise.all([
            LeagueService.getUpdatedLeagueDetailsOfUser(
              userIfExists,
              leagues,
              updatedXPPoints
            ),
            UserDBService.addStreaks(userIfExists),
            QuizDBServiceV4.getQuizRecommendations(
              userIfExists._id,
              quizIfExists.topicId.toString()
            ),
          ]);

          (async () => {
            const dataForCrm = await QuizDBServiceV4.getQuizDataForCrm(
              userIfExists,
              user._id,
              updatedXPPoints
            );

            zohoCrmService.addAccounts(
              ctx.request.zohoAccessToken,
              dataForCrm,
              true
            );
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
            quizRecommendations,
            isGiftedStreakFreeze,
          });
        }
      }
    );
  }
}

export default new QuizController();
