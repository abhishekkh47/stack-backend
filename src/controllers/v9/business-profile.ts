import { Auth } from "@app/middleware";
import { BusinessProfileTable, UserTable } from "@app/model";
import { HttpMethod } from "@app/types";
import { Route, IMAGE_ACTIONS, IS_RETRY } from "@app/utility";
import BaseController from "../base";
import { BusinessProfileService } from "@app/services/v9";
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
    const { key, isRetry, idea } = query;
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
        idea
      );
    } else {
      response = await BusinessProfileService.generateAISuggestions(
        userExists,
        key,
        userBusinessProfile,
        idea
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
    const [userExists, businessProfile] = await Promise.all([
      UserTable.findOne({ _id: user._id }),
      BusinessProfileTable.findOne({ userId: user._id }).select(
        "businessHistory"
      ),
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
        businessProfile.businessHistory
      );
    }
    return this.Ok(ctx, { message: "Success", data: response });
  }
}

export default new BusinessProfileController();
