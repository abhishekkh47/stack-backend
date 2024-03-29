import { Auth } from "@app/middleware";
import { BusinessProfileTable, UserTable } from "@app/model";
import { HttpMethod } from "@app/types";
import {
  Route,
  IMAGE_ACTIONS,
  IS_RETRY,
  ANALYTICS_EVENTS,
  SYSTEM_INPUT,
} from "@app/utility";
import BaseController from "../base";
import { BusinessProfileService } from "@app/services/v9";
import { AnalyticsService } from "@app/services/v4";
class BusinessProfileController extends BaseController {
  /**
   * @description This method is to generate suggestions from OpenAI-API based on based on user input
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/get-ai-suggestions", method: HttpMethod.GET })
  @Auth()
  public async getAISuggestion(ctx: any) {
    const { user, query, headers } = ctx.request;
    const { key, isRetry, isFromProfile } = query;
    let response = null;
    const [userExists, userBusinessProfile] = await Promise.all([
      UserTable.findOne({ _id: user._id }),
      BusinessProfileTable.findOne({ userId: user._id }),
    ]);
    if (!userExists) {
      return this.BadRequest(ctx, "User Not Found");
    }
    if (userExists.requestId && userExists.requestId == headers.requestid) {
      return this.Ok(ctx, { message: "Success", data: "Multiple Requests" });
    }
    if (!key) {
      return this.BadRequest(ctx, "Please provide a valid requirement");
    }
    if (
      IMAGE_ACTIONS.includes(key) &&
      isRetry == IS_RETRY.TRUE &&
      userBusinessProfile.logoGenerationInfo.isUnderProcess
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
        false,
        isFromProfile
      );
    } else {
      response = await BusinessProfileService.generateAISuggestions(
        userExists,
        key,
        userBusinessProfile,
        isRetry
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
    method: HttpMethod.GET,
  })
  @Auth()
  public async getBusinessIdea(ctx: any) {
    const { user, query } = ctx.request;
    const [userExists, userBusinessProfile] = await Promise.all([
      UserTable.findOne({ _id: user._id }),
      BusinessProfileTable.findOne({ userId: user._id }),
    ]);
    if (!userExists) {
      return this.BadRequest(ctx, "User Not Found");
    }
    if (!query.category || !query.problem || !query.passion) {
      return this.BadRequest(ctx, "Provide a Category and Problem");
    }
    const prompt = `category: ${query.category}; problem: ${query.problem}.**`;
    const businessIdea = await BusinessProfileService.generateBusinessIdea(
      SYSTEM_INPUT.SYSTEM,
      prompt,
      query.passion,
      userExists,
      query.isRetry,
      userBusinessProfile
    );
    AnalyticsService.sendEvent(
      ANALYTICS_EVENTS.PASSION_SUBMITTED,
      {
        "Item Name": query.passion,
      },
      {
        user_id: userExists._id,
      }
    );
    AnalyticsService.sendEvent(
      ANALYTICS_EVENTS.SUB_PASSION_SUBMITTED,
      {
        "Item Name": query.category,
      },
      {
        user_id: userExists._id,
      }
    );
    AnalyticsService.sendEvent(
      ANALYTICS_EVENTS.PROBLEM_SUBMITTED,
      {
        "Item Name": query.problem,
      },
      {
        user_id: userExists._id,
      }
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
    method: HttpMethod.GET,
  })
  @Auth()
  public async maximizeBusinessIdea(ctx: any) {
    const { user, query } = ctx.request;
    const [userExists, userBusinessProfile] = await Promise.all([
      UserTable.findOne({ _id: user._id }),
      BusinessProfileTable.findOne({ userId: user._id }),
    ]);
    if (!userExists) {
      return this.BadRequest(ctx, "User Not Found");
    }
    if (!query.idea) {
      return this.BadRequest(ctx, "Please provide your Business Idea");
    }
    const prompt = `problem: ${query.idea}.**`;
    const businessIdea = await BusinessProfileService.generateBusinessIdea(
      SYSTEM_INPUT.USER,
      prompt,
      "maximize",
      userExists,
      query.isRetry,
      userBusinessProfile
    );
    AnalyticsService.sendEvent(
      ANALYTICS_EVENTS.BUSINESS_IDEA_SUBMITTED,
      {
        "Item Name": query.idea,
      },
      {
        user_id: userExists._id,
      }
    );
    return this.Ok(ctx, { message: "Success", data: businessIdea });
  }
}

export default new BusinessProfileController();
