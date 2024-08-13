import { Auth } from "@app/middleware";
import { BusinessProfileTable, UserTable } from "@app/model";
import { HttpMethod } from "@app/types";
import { Route } from "@app/utility";
import BaseController from "../base";
import { MilestoneDBService } from "@app/services/v9";
class MilestoneController extends BaseController {
  /**
   * @description This is to fetch milestone list
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/get-milestones", method: HttpMethod.GET })
  @Auth()
  public async getMilestonesList(ctx: any) {
    const { user } = ctx.request;
    const userExists = await UserTable.findOne({ _id: user._id });
    if (!userExists) {
      return this.BadRequest(ctx, "User Not Found");
    }
    const milestones = await MilestoneDBService.getMilestones(userExists);
    return this.Ok(ctx, {
      data: milestones,
    });
  }

  /**
   * @description This is to fetch focus areas and categories for onbaording flow
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/get-milestone-goals/:milestoneId", method: HttpMethod.GET })
  @Auth()
  public async getMilestoneGoals(ctx: any) {
    const { user, params } = ctx.request;
    const userExists = await UserTable.findOne({ _id: user._id });
    if (!userExists) {
      return this.BadRequest(ctx, "User Not Found");
    }
    const milestoneGoals = await MilestoneDBService.getMilestoneGoals(
      params.milestoneId
    );
    return this.Ok(ctx, {
      data: milestoneGoals,
    });
  }

  /**
   * @description This is to select and update the current milestones
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/select-milestone", method: HttpMethod.POST })
  @Auth()
  public async selectMilestone(ctx: any) {
    const { user, body } = ctx.request;
    const userExists = await UserTable.findOne({ _id: user._id });
    if (!userExists) {
      return this.BadRequest(ctx, "User Not Found");
    }
    let obj = {
      currentMilestone: {
        milestoneId: body.milestoneId,
        milestoneUpdatedAt: new Date().toISOString(),
      },
    };
    await BusinessProfileTable.findOneAndUpdate(
      { userId: user.Id },
      { $set: obj }
    );
    return this.Ok(ctx, { message: "success" });
  }

  /**
   * @description This is to select and update the current milestones
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/get-daily-milestone", method: HttpMethod.GET })
  @Auth()
  public async getUserMilestoneGoals(ctx: any) {
    const { user, body } = ctx.request;
    const [userExists, businessProfile] = await Promise.all([
      UserTable.findOne({ _id: user._id }),
      BusinessProfileTable.findOne({ userId: user._id }),
    ]);
    if (!userExists) {
      return this.BadRequest(ctx, "User Not Found");
    }
    const goals = await MilestoneDBService.getCurrentMilestoneGoals(
      userExists,
      businessProfile
    );
    return this.Ok(ctx, { data: goals });
  }
}

export default new MilestoneController();
