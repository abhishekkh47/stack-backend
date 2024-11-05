import BaseController from "@app/controllers/base";
import { Auth, PrimeTrustJWT } from "@app/middleware";
import { LeagueTable, QuizResult, QuizTable, UserTable } from "@app/model";
import { zohoCrmService } from "@app/services/v1";
import {
  LeagueService,
  QuizDBService as QuizDBServiceV4,
  UserDBService,
} from "@app/services/v4";
import { MilestoneDBService, QuizDBService } from "@app/services/v9";
import { HttpMethod } from "@app/types";
import { Route } from "@app/utility";
import { validation } from "@app/validations/v1/apiValidation";

class QuizController extends BaseController {
  /**
   * @description This method is used to post current quiz results
   * @param ctx
   * @return {*}
   */
  @Route({ path: "/submit-quiz-result", method: HttpMethod.POST })
  @Auth()
  @PrimeTrustJWT(true)
  public storeQuizResults(ctx: any) {
    const reqParam = ctx.request.body;
    const { user } = ctx.request;
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
            updatedUser,
            resultScreenInfo,
          } = await QuizDBService.storeQuizInformation(
            userIfExists,
            reqParam,
            quizIfExists
          );
          const [
            { previousLeague, currentLeague, nextLeague, isNewLeagueUnlocked },
            streaksDetails,
            updateTodayRewards,
            updateCompletedGoalCount,
          ] = await Promise.all([
            LeagueService.getUpdatedLeagueDetailsOfUser(
              userIfExists,
              leagues,
              updatedXPPoints
            ),
            UserDBService.addStreaks(updatedUser),
            MilestoneDBService.updateTodaysRewards(userIfExists, totalFuel),
            QuizDBService.updateGoalCount(userIfExists),
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
            resultScreenInfo,
          });
        }
      }
    );
  }

  /**
   * @description This is to get unexpected event details
   * @param ctx
   * @returns {*}
   */
  @Route({
    path: "/get-event-details/:eventId",
    method: HttpMethod.GET,
  })
  @Auth()
  public async getMilestoneRoadmap(ctx: any) {
    const { user, params } = ctx.request;
    const { milestoneId } = params;
    const userExists = await UserTable.findOne({ _id: user._id });
    if (!userExists) {
      return this.BadRequest(ctx, "User Not Found");
    }
    const milestoneRoadmap = await MilestoneDBService.getMilestoneRoadmap(
      milestoneId
    );
    return this.Ok(ctx, { data: milestoneRoadmap });
  }
}

export default new QuizController();
