import { Auth } from "@app/middleware";
import { QuizResult, QuizTopicTable, UserTable } from "@app/model";
import { QuizDBService } from "@app/services/v4";
import { HttpMethod } from "@app/types";
import { Route } from "@app/utility";
import BaseController from "@app/controllers/base";

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
}

export default new QuizController();
