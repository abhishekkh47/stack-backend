import BaseController from "@app/controllers/base";
import { Auth, PrimeTrustJWT } from "@app/middleware";
import { LeagueTable, QuizResult, QuizTable, UserTable } from "@app/model";
import { zohoCrmService } from "@app/services/v1";
import {
  LeagueService,
  QuizDBService as QuizDBServiceV4,
  UserDBService,
} from "@app/services/v4";
import { QuizDBService } from "@app/services/v6";
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
          let leagues = await LeagueTable.find({})
            .select("_id name image minPoint maxPoint colorCode")
            .sort({ minPoint: 1 });
          let userIfExists = await UserTable.findOne({
            _id: user._id,
          }).populate("streakGoal");
          if (!userIfExists) {
            return this.BadRequest(ctx, "User Not Found");
          }
          const quizIfExists: any = await QuizTable.findOne({
            _id: reqParam.quizId,
          });
          if (!quizIfExists) {
            return this.BadRequest(ctx, "Quiz Details Doesn't Exists");
          }
          const quizResultsIfExists = await QuizResult.findOne({
            userId: user._id,
            quizId: reqParam.quizId,
          });
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
          const {
            previousLeague,
            currentLeague,
            nextLeague,
            isNewLeagueUnlocked,
          } = await LeagueService.getUpdatedLeagueDetailsOfUser(
            userIfExists,
            leagues,
            updatedXPPoints
          );
          const streaksDetails = await UserDBService.addStreaks(userIfExists);
          const quizRecommendations =
            await QuizDBServiceV4.getQuizRecommendations(
              userIfExists._id,
              quizIfExists.topicId
            );
          const dataForCrm = await QuizDBServiceV4.getQuizDataForCrm(
            userIfExists,
            user._id,
            updatedXPPoints
          );
          await zohoCrmService.addAccounts(
            ctx.request.zohoAccessToken,
            dataForCrm,
            true
          );
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
