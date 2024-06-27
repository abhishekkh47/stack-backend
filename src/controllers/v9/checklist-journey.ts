import { Auth } from "@app/middleware";
import { QuizTopicTable, UserTable } from "@app/model";
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
    if (!userExists) {
      return this.BadRequest(ctx, "User Not Found");
    }
    const topicId = userExists.focusAreaTopic;
    if (!categoryId) {
      categoryId = await ChecklistDBService.getDefaultCategory(
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

  /**
   * @description This is to submit the selected 'focus area topic' from the onboarding flow
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/submit-focus-area", method: HttpMethod.POST })
  @Auth()
  public async submitFocusArea(ctx: any) {
    const { user, body } = ctx.request;
    let focusAreaTopic = body.focusAreaTopic;
    const [userExists, quizTopics] = await Promise.all([
      UserTable.findOne({ _id: user._id }),
      QuizTopicTable.findOne({ order: 1 }),
    ]);
    if (!userExists) {
      return this.BadRequest(ctx, "User Not Found");
    }
    if (focusAreaTopic == "1") {
      focusAreaTopic = quizTopics._id;
    }
    await UserTable.findOneAndUpdate(
      { _id: userExists._id },
      { $set: { focusAreaTopic } },
      { upsert: true }
    );
    return this.Ok(ctx, { message: "success" });
  }

  /**
   * @description This is to get the personalized daily challenges
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/get-daily-challenges", method: HttpMethod.GET })
  @Auth()
  public async dailyChallenges(ctx: any) {
    const { user, query } = ctx.request;
    const userIfExists = await UserTable.findOne({ _id: user._id });
    let categoryId = query.categoryId;
    if (!userIfExists) {
      return this.BadRequest(ctx, "User Not Found");
    }
    const topicId = userIfExists.focusAreaTopic;
    if (!categoryId) {
      categoryId = await ChecklistDBService.getDefaultCategory(
        userIfExists,
        topicId
      );
    }
    const challengeDetails = await ChecklistDBService.getDailyChallenges(
      userIfExists,
      categoryId
    );
    return this.Ok(ctx, {
      data: challengeDetails,
    });
  }
}

export default new ChecklistJourneyController();
