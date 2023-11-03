import BaseController from "@app/controllers/base";
import { Auth, PrimeTrustJWT } from "@app/middleware";
import {
  LeagueTable,
  QuizResult,
  QuizTable,
  QuizTopicTable,
  UserTable,
} from "@app/model";
import { zohoCrmService } from "@app/services/v1";
import { LeagueService, QuizDBService, UserDBService } from "@app/services/v4";
import { HttpMethod } from "@app/types";
import { Route } from "@app/utility";
import { validation } from "@app/validations/v1/apiValidation";

class QuizController extends BaseController {
  /**
   * @description This method is used to give quiz topics available or disabled based on user's last quiz
   * @param ctx
   * @return {*}
   */
  @Route({ path: "/quizzes", method: HttpMethod.GET })
  @Auth()
  public async getQuiz(ctx: any) {
    try {
      const user = await UserTable.findOne({ _id: ctx.request.user._id });
      if (!user) {
        return this.BadRequest(ctx, "User not found");
      }
      const { categoryId, status } = ctx.request.query; //status 1 - Start Journey , 2 - Completed and 3 - Stages
      const quizCategoryIfExists = await QuizTopicTable.findOne({
        _id: categoryId,
      });
      if (!quizCategoryIfExists) {
        return this.BadRequest(ctx, "Quiz Category Not Found");
      }
      if (quizCategoryIfExists.hasStages && status == "3") {
        const stages = await QuizDBService.getStageWiseQuizzes(
          [quizCategoryIfExists._id],
          user._id,
          false
        );
        return this.Ok(ctx, { data: stages });
      } else {
        if (status && !["1", "2"].includes(status)) {
          return this.BadRequest(ctx, "Please enter valid status");
        }

        const quizResult = await QuizResult.find({
          userId: user._id,
          isOnBoardingQuiz: false,
        });
        let quizIds = [];
        if (quizResult.length > 0) {
          quizIds = quizResult.map((x) => x.quizId);
        }
        let completedCount: any = 0;
        if (categoryId) {
          completedCount = quizResult.filter(
            (x) => x.topicId.toString() == categoryId.toString()
          ).length;
        }
        const quizInformation = await QuizDBService.getQuizData(
          quizIds,
          categoryId,
          status
        );
        if (!categoryId) return this.Ok(ctx, { data: quizInformation });
        return this.Ok(ctx, { data: { quizInformation, completedCount } });
      }
    } catch (error) {
      return this.BadRequest(ctx, error.message);
    }
  }

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
          const { totalXPPoints, updatedXPPoints, totalFuel } =
            await QuizDBService.storeQuizInformation(
              user._id,
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
            await QuizDBService.getQuizRecommendations(
              userIfExists._id,
              quizIfExists.topicId
            );
          const dataForCrm = await QuizDBService.getQuizDataForCrm(
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
          });
        }
      }
    );
  }
}

export default new QuizController();
