import { Route } from "@app/utility";
import { HttpMethod } from "@app/types";
import BaseController from "../base";
import { Auth } from "@app/middleware";
import { UserTable } from "@app/model";
import { SubscriptionDBService } from "@app/services/v9";

class SubscriptionController extends BaseController {
  /**
   * @description This is to update coins and cash purchases in user profile
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/submit-purchase-request", method: HttpMethod.POST })
  @Auth()
  public async getDailyMilestone(ctx: any) {
    const { user, body } = ctx.request;
    const userExists = await UserTable.findOne({ _id: user._id });
    if (!userExists) {
      return this.UnAuthorized(ctx, "User Not Found");
    }
    await SubscriptionDBService.addPurchases(userExists, body);
    return this.Ok(ctx, { message: "success" });
  }
}

export default new SubscriptionController();
