import { Auth } from "@app/middleware";
import { BusinessProfileTable, UserTable } from "@app/model";
import { HttpMethod } from "@app/types";
import { Route } from "@app/utility";
import BaseController from "../base";
import { BusinessProfileService } from "@app/services/v10";
class BusinessProfileController extends BaseController {
  /**
   * @description This method is to generate suggestions from OpenAI-API based on based on user input
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/get-ai-suggestions", method: HttpMethod.POST })
  @Auth()
  public async getAISuggestion(ctx: any) {
    const { user, body, headers } = ctx.request;
    const { key, isRetry, userInput, idea, type, answerOfTheQuestion } = body;
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

    // Generating AI suggestions based on the given key
    response = await BusinessProfileService.generateAISuggestions(
      userExists,
      key,
      userBusinessProfile,
      idea || userBusinessProfile.description,
      type,
      answerOfTheQuestion,
      isRetry,
      false,
      userInput
    );

    return this.Ok(ctx, { message: "Success", data: response });
  }
}

export default new BusinessProfileController();
