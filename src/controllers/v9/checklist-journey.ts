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
  public async getTopicMenu(ctx: any) {
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
}

export default new ChecklistJourneyController();
