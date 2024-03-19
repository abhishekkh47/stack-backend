import { Auth } from "@app/middleware";
import { BusinessProfileTable, UserTable, ProUserTable } from "@app/model";
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
}

export default new BusinessProfileController();
