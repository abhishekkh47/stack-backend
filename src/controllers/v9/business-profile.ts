import { Auth } from "@app/middleware";
import {
  BusinessProfileTable,
  UserTable,
  AIToolsUsageStatusTable,
  MilestoneGoalsTable,
} from "@app/model";
import { HttpMethod } from "@app/types";
import { Route, IMAGE_ACTIONS, IS_RETRY } from "@app/utility";
import BaseController from "../base";
import { BusinessProfileService } from "@app/services/v9";
import moment from "moment";
class BusinessProfileController extends BaseController {
  /**
   * @description This method is to generate suggestions from OpenAI-API based on based on user input
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/get-ai-suggestions", method: HttpMethod.GET })
  @Auth()
  public async getAISuggestion(ctx: any) {
    const { user, query, headers, body } = ctx.request;
    // type - business name type
    const { key, isRetry, idea, type } = query;
    // const { key, isRetry, idea, type } = body;
    let response = null;
    const [userExists, userBusinessProfile] = await Promise.all([
      UserTable.findOne({ _id: user._id }),
      BusinessProfileTable.findOne({ userId: user._id }).lean(),
    ]);
    if (!userExists) {
      return this.BadRequest(ctx, "User Not Found");
    }
    if (userExists.requestId && userExists.requestId == headers.requestid) {
      return this.Ok(ctx, { message: "Success", data: "Multiple Requests" });
    }
    if (!idea && !userBusinessProfile.description) {
      return this.BadRequest(
        ctx,
        "Please generate a business idea and try again"
      );
    }
    if (!key) {
      return this.BadRequest(ctx, "Please provide a valid requirement");
    }
    const elapsedTime =
      moment().unix() - userBusinessProfile?.logoGenerationInfo.startTime;
    if (
      IMAGE_ACTIONS.includes(key) &&
      isRetry == IS_RETRY.TRUE &&
      userBusinessProfile?.logoGenerationInfo.isUnderProcess &&
      elapsedTime < 200
    ) {
      return this.Ok(ctx, {
        message: "Success",
        data: {
          finished: false,
          suggestions: null,
          isRetry: true,
        },
      });
    }
    if (IMAGE_ACTIONS.includes(key)) {
      response = await BusinessProfileService.generateAILogos(
        userExists,
        key,
        userBusinessProfile,
        isRetry,
        headers.requestid,
        idea
      );
    } else {
      response = await BusinessProfileService.generateAISuggestions(
        userExists,
        key,
        userBusinessProfile,
        idea || userBusinessProfile.description,
        type
      );
    }
    return this.Ok(ctx, { message: "Success", data: response });
  }

  /**
   * @description This method is to enable/disable stealth mode
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/toggle-stealth-mode", method: HttpMethod.POST })
  @Auth()
  public async toggleStealthMode(ctx: any) {
    const { user, body } = ctx.request;
    const [userExists, _] = await Promise.all([
      UserTable.findOne({ _id: user._id }),
      BusinessProfileTable.findOneAndUpdate(
        { userId: user._id },
        { $set: { enableStealthMode: body.enableStealthMode } },
        { upsert: true }
      ),
    ]);
    if (!userExists) {
      return this.BadRequest(ctx, "User Not Found");
    }
    return this.Ok(ctx, { message: "Success" });
  }

  /**
   * @description This method is to get history of business tools used
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/get-business-history", method: HttpMethod.GET })
  @Auth()
  public async getBusinessHistory(ctx: any) {
    const { user } = ctx.request;
    const [userExists, businessProfile, milestoneGoals] = await Promise.all([
      UserTable.findOne({ _id: user._id }),
      BusinessProfileTable.findOne({ userId: user._id }).select(
        "businessHistory"
      ),
      MilestoneGoalsTable.find(),
    ]);
    if (!userExists) {
      return this.BadRequest(ctx, "User Not Found");
    }
    if (!businessProfile) {
      return this.Ok(ctx, { message: "Success", data: [] });
    }

    let response = [];
    if (businessProfile?.businessHistory) {
      response = await BusinessProfileService.getBusinessHistory(
        businessProfile.businessHistory,
        milestoneGoals
      );
    }
    return this.Ok(ctx, { message: "Success", data: response });
  }

  /**
   * @description This method is to generate business-idea using OpenAI GPT
   * @param ctx
   * @returns {*}
   */
  @Route({
    path: "/generate-business-idea",
    method: HttpMethod.POST,
  })
  public async getBusinessIdea(ctx: any) {
    const { body } = ctx.request;

    if (!body.idea && !body.businessType) {
      return this.BadRequest(
        ctx,
        "Please provide your Business Idea and Business Type"
      );
    }
    const businessIdea = await BusinessProfileService.generateBusinessIdea(
      body.idea,
      Number(body.businessType)
    );
    return this.Ok(ctx, { message: "Success", data: businessIdea });
  }

  /**
   * @description This method is to maximize user provided business-idea
   * @param ctx
   * @returns {*}
   */
  @Route({
    path: "/maximize-business-idea",
    method: HttpMethod.POST,
  })
  public async maximizeBusinessIdea(ctx: any) {
    const { body } = ctx.request;
    if (!body.idea && !body.businessType) {
      return this.BadRequest(
        ctx,
        "Please provide your Business Idea and Business Type"
      );
    }
    const prompt = `problem: ${body.idea}.**`;
    const businessIdea = await BusinessProfileService.ideaValidator(prompt);
    return this.Ok(ctx, { message: "Success", data: businessIdea });
  }

  /**
   * @description This method is to update AI Tools usage status for idea generator and idea validator when used from AI Toolbox
   * @param ctx
   * @returns {*}
   */
  @Route({
    path: "/ai-tool-status-update",
    method: HttpMethod.POST,
  })
  @Auth()
  public async updateAIToolStatus(ctx: any) {
    const { user, body } = ctx.request;
    const userExists = await UserTable.findOne({ _id: user._id });
    if (!userExists) {
      return this.BadRequest(ctx, "User Not Found");
    }
    let aiToolUsageObj = {};
    aiToolUsageObj[body.ideaGenerationType] = true;
    await AIToolsUsageStatusTable.findOneAndUpdate(
      { userId: userExists._id },
      { $set: aiToolUsageObj },
      { upsert: true, new: true }
    );
    return this.Ok(ctx, { message: "Success" });
  }
}

export default new BusinessProfileController();
