import { Auth } from "@app/middleware";
import { UserTable } from "@app/model";
import { HttpMethod } from "@app/types";
import { Route } from "@app/utility";
import BaseController from "../base";
import { ChecklistDBService } from "@app/services/v9";
class ChecklistJourneyController extends BaseController {
  /**
   * @description This method is to fetch quiz categories
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/get-topic-menu", method: HttpMethod.GET })
  @Auth()
  public async getTopicMenu(ctx: any) {
    const { user } = ctx.request;
    const userExists = await UserTable.findOne({ _id: user._id });
    if (!userExists) {
      return this.BadRequest(ctx, "User Not Found");
    }
    const topicDetails = await ChecklistDBService.getQuizTopics(userExists);
    return this.Ok(ctx, { data: topicDetails });
  }

  /**
   * @description This method is to fetch quiz categories
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/get-category-menu/:topicId", method: HttpMethod.GET })
  @Auth()
  public async getCategoryMenu(ctx: any) {
    const { user, params } = ctx.request;
    const userExists = await UserTable.findOne({ _id: user._id });
    if (!userExists) {
      return this.BadRequest(ctx, "User Not Found");
    }
    const categoryDetails = await ChecklistDBService.getQuizCategories(
      userExists,
      params.topicId
    );
    return this.Ok(ctx, { data: categoryDetails });
  }

  /**
   * @description This method is to fetch levels and challenges in a category
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/get-checklist-journey/:categoryId", method: HttpMethod.GET })
  @Auth()
  public async getCheckListJourneyByCategory(ctx: any) {
    const { user, params } = ctx.request;
    const userExists = await UserTable.findOne({ _id: user._id });
    if (!userExists) {
      return this.BadRequest(ctx, "User Not Found");
    }
    const { levels, upcomingChallenge, checklistFlowCompleted } =
      await ChecklistDBService.getLevelsAndChallenges(
        userExists,
        params.categoryId
      );
    return this.Ok(ctx, {
      data: { levels, upcomingChallenge, checklistFlowCompleted },
    });
  }

  /**
   * @description This method is to fetch levels and challenges in a category
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/get-checklist-journey", method: HttpMethod.GET })
  @Auth()
  public async getCheckListJourney(ctx: any) {
    const { user, params } = ctx.request;
    const userExists = await UserTable.findOne({ _id: user._id });
    if (!userExists) {
      return this.BadRequest(ctx, "User Not Found");
    }

    const res = await ChecklistDBService.getLevelsAndChallenges(
      userExists,
      params.categoryId
    );
    return this.Ok(ctx, {
      data: res,
    });
  }
}

export default new ChecklistJourneyController();
