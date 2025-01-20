import { Auth } from "@app/middleware";
import { BusinessProfileTable, QuizTable, UserTable } from "@app/model";
import { QuizDBService } from "@app/services/v4";
import { HttpMethod } from "@app/types";
import { getQuizImageAspectRatio, QUIZ_TYPE, Route } from "@app/utility";
import BaseController from "@app/controllers/base";
import { BusinessProfileService as BusinessProfileServiceV10 } from "@app/services/v10";

class QuizController extends BaseController {
  /**
   * @description This method is used to give quiz questions based on quiz
   * @param ctx
   * @return {*}
   */
  @Route({ path: "/quiz-questions/:quizId", method: HttpMethod.GET })
  @Auth()
  public async getQuizQuestions(ctx: any) {
    const { user, headers, params, query } = ctx.request;
    const quizId = params.quizId;
    if (!params.quizId) {
      return this.BadRequest(ctx, "Quiz not found");
    }
    const isCompleted = JSON.parse(query?.isCompleted || null);
    const [userExists, businessProfile, quizQuestionList, quizDetails] =
      await Promise.all([
        UserTable.findOne({ _id: user._id }),
        BusinessProfileTable.findOne({ userId: user._id }).lean(),
        QuizDBService.getQuizQuestions(user, quizId, headers, isCompleted),
        QuizTable.findOne({ _id: quizId }),
      ]);
    if (quizDetails.quizType == QUIZ_TYPE.STORY) {
      BusinessProfileServiceV10.preLoadAISuggestions(
        userExists,
        businessProfile,
        quizId
      );
    }
    const quizImageAspectRatio = await getQuizImageAspectRatio(headers);
    return this.Ok(ctx, {
      quizQuestionList,
      message: "Success",
      quizImageAspectRatio,
    });
  }
}

export default new QuizController();
