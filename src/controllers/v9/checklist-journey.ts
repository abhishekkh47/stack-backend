import { Auth } from "@app/middleware";
import { UserTable } from "@app/model";
import { HttpMethod } from "@app/types";
import { Route } from "@app/utility";
import BaseController from "../base";
import { ChecklistDBService } from "@app/services/v9";
class ChecklistJourneyController extends BaseController {
  /**
   * @description This is to fetch focus areas and categories for onbaording flow
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/get-focus-area", method: HttpMethod.GET })
  @Auth()
  public async getFocusArea(ctx: any) {
    const { user } = ctx.request;
    const userExists = await UserTable.findOne({ _id: user._id });
    if (!userExists) {
      return this.BadRequest(ctx, "User Not Found");
    }
    const topicDetails = await ChecklistDBService.getFocusArea();
    return this.Ok(ctx, {
      data: { topicDetails, focusAreaTopic: userExists.focusAreaTopic || null },
    });
  }
  
   /*
   * @description This method is to fetch quiz topics
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
  @Route({ path: "/get-checklist-journey", method: HttpMethod.GET })
  @Auth()
  public async getCheckListJourneyByCategory(ctx: any) {
    const { user, query } = ctx.request;
    const userExists = await UserTable.findOne({ _id: user._id });
    let categoryId = query.categoryId;
    const topicId = userExists.focusAreaTopic;
    if (!userExists) {
      return this.BadRequest(ctx, "User Not Found");
    }
    if (!categoryId) {
      categoryId = await ChecklistDBService.getDefaultLevelsAndChallenges(
        userExists,
        topicId
      );
    }
    const challengeDetails = await ChecklistDBService.getLevelsAndChallenges(
      userExists,
      categoryId
    );
    return this.Ok(ctx, {
      data: challengeDetails,
    });
  }

  /**
   * @description This method is called on 4th action of each level
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/checklist-levelup", method: HttpMethod.POST })
  @Auth()
  public async checklistLevelup(ctx: any) {
    const { user, body } = ctx.request;
    const userExists = await UserTable.findOne({ _id: user._id });
    if (!userExists) {
      return this.BadRequest(ctx, "User Not Found");
    }
    const categoryDetails = await ChecklistDBService.storeWeeklyReward(
      userExists,
      body
    );
    return this.Ok(ctx, { data: categoryDetails });
  }
}

export default new ChecklistJourneyController();
