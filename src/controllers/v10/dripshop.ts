import { Auth } from "@app/middleware";
import { UserTable } from "@app/model";
import { HttpMethod } from "@app/types";
import { Route } from "@app/utility";
import BaseController from "../base";
import { DripshopDBService } from "@app/services/v10";

class DripshopController extends BaseController {
  /**
   * @description This is to get the streak reward list
   * @param ctx
   * @returns
   */
  @Route({ path: "/get-streak-rewards-list", method: HttpMethod.GET })
  @Auth()
  public async getStreakRewardList(ctx: any) {
    const { user } = ctx.request;
    const userExists = await UserTable.findOne({ _id: user._id });
    if (!userExists) {
      return this.UnAuthorized(ctx, "User Not Found");
    }
    const response = await DripshopDBService.getStreakRewardList(userExists);
    return this.Ok(ctx, {
      data: { ...response, userId: user._id },
    });
  }

  /**
   * @description This is to get claim the streak rewards
   * @param ctx
   * @returns
   */
  @Route({ path: "/claim-streak-reward", method: HttpMethod.POST })
  @Auth()
  public async claimStreakReward(ctx: any) {
    const { user, body } = ctx.request;
    const userExists = await UserTable.findOne({ _id: user._id });
    if (!userExists) {
      return this.UnAuthorized(ctx, "User Not Found");
    }
    const response = await DripshopDBService.claimStreakReward(
      userExists,
      body
    );
    return this.Ok(ctx, { message: "reward claimed" });
  }
}

export default new DripshopController();
