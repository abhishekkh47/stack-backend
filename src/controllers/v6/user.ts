import BaseController from "@app/controllers/base";
import { Auth } from "@app/middleware";
import { QuizResult, UserTable } from "@app/model";
import { UserDBService } from "@app/services/v6";
import { HttpMethod } from "@app/types";
import { Route } from "@app/utility";
import { BusinessProfileService, QuizDBService } from "@app/services/v4";

class UserController extends BaseController {
  /**
   * @description This method is used to view profile for both parent and child
   * @param ctx
   */
  @Route({ path: "/get-profile/:id", method: HttpMethod.GET })
  @Auth()
  public async getProfile(ctx: any) {
    const { id } = ctx.request.params;
    if (!/^[0-9a-fA-F]{24}$/.test(id))
      return this.BadRequest(ctx, "Enter valid ID.");
    let { data } = await UserDBService.getProfile(id);
    const businessProfile = await BusinessProfileService.getBusinessProfile(id);

    data = {
      ...data,
      businessProfile,
    };

    return this.Ok(ctx, data, true);
  }
  /**
   * @description This method is used to refill the streak freeze
   * @param ctx
   * @returns {*}
   */
  @Route({
    path: "/refill-streak-freeze",
    method: HttpMethod.POST,
  })
  @Auth()
  public async refillStreakFreeze(ctx: any) {
    const { user } = ctx.request;
    const userIfExists = await UserTable.findOne({ _id: user._id });
    if (!userIfExists) {
      return this.BadRequest(ctx, "User not found");
    }
    await UserDBService.refillStreakFreezeWithFuel(userIfExists);
    return this.Ok(ctx, {
      message: "Success",
    });
  }

  /**
   * @description This method is used to get quiz recommendatios
   * @param ctx
   * @return {*}
   */
  @Route({ path: "/quiz-recommendations", method: HttpMethod.GET })
  @Auth()
  public async quizRecommendations(ctx: any) {
    try {
      const userIfExists = await UserTable.findOne({
        _id: ctx.request.user._id,
      });
      if (!userIfExists) {
        return this.BadRequest(ctx, "User not found");
      }
      const lastQuizPlayed: any = await QuizResult.findOne({
        userId: userIfExists._id,
        isOnBoardingQuiz: false,
      }).sort({ createdAt: -1 });
      const quizzes = await QuizDBService.getQuizRecommendations(
        userIfExists._id,
        lastQuizPlayed?.topicId || null
      );
      return this.Ok(ctx, { data: quizzes, message: "Success" });
    } catch (error) {
      return this.BadRequest(ctx, error.message);
    }
  }
}

export default new UserController();
