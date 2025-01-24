import { Auth } from "@app/middleware";
import { BusinessProfileTable, UserTable } from "@app/model";
import { HttpMethod } from "@app/types";
import { Route } from "@app/utility";
import BaseController from "../base";
import { MilestoneDBService } from "@app/services/v10";

class MilestoneController extends BaseController {
  /**
   * @description This is to select and update the current milestones
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/get-daily-milestone", method: HttpMethod.GET })
  @Auth()
  public async getDailyMilestone(ctx: any) {
    const { user } = ctx.request;
    const [userExists, businessProfile] = await Promise.all([
      UserTable.findOne({ _id: user._id }),
      BusinessProfileTable.findOne({ userId: user._id }).lean(),
    ]);
    if (!userExists) {
      return this.UnAuthorized(ctx, "User Not Found");
    }
    const response = await MilestoneDBService.getUserMilestoneGoals(
      userExists,
      businessProfile
    );
    return this.Ok(ctx, {
      data: { ...response, userId: user._id },
    });
  }

  /**
   * @description This is to claim 50 tokens reward on level completion
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/claim-level-reward", method: HttpMethod.POST })
  @Auth()
  public async claimLevelReward(ctx: any) {
    const { user, body } = ctx.request;
    const [userExists, businessProfile] = await Promise.all([
      UserTable.findOne({ _id: user._id }),
      BusinessProfileTable.findOne({ userId: user._id }),
    ]);
    if (!userExists) {
      return this.UnAuthorized(ctx, "User Not Found");
    }
    await MilestoneDBService.claimLevelReward(
      userExists,
      businessProfile,
      body
    );
    return this.Ok(ctx, { message: "success" });
  }
}

export default new MilestoneController();
