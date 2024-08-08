import { Auth } from "@app/middleware";
import { UserTable } from "@app/model";
import { HttpMethod } from "@app/types";
import { Route } from "@app/utility";
import BaseController from "../base";
import { MilestoneDBService } from "@app/services/v9";
class MilestoneController extends BaseController {
  /**
   * @description This is to fetch focus areas and categories for onbaording flow
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/get-milestones", method: HttpMethod.GET })
  @Auth()
  public async getFocusArea(ctx: any) {
    const { user } = ctx.request;
    const userExists = await UserTable.findOne({ _id: user._id });
    if (!userExists) {
      return this.BadRequest(ctx, "User Not Found");
    }
    const milestones = await MilestoneDBService.getMilestones();
    return this.Ok(ctx, {
      data: { milestones },
    });
  }
}

export default new MilestoneController();
