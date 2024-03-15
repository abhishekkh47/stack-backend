import BaseController from "@app/controllers/base";
import { UserTable, ProUserTable } from "@app/model";
import { Auth } from "@app/middleware";
import { HttpMethod } from "@app/types";
import { Route } from "@app/utility";
import { UserDBService } from "@app/services/v9";

class UserController extends BaseController {
  /**
   * @description This method is used update if user is a pro-user or not
   * @param ctx
   */
  @Route({ path: "/udpate-subscription-status", method: HttpMethod.POST })
  @Auth()
  public async updateSubscriptionStatus(ctx: any) {
    const { user, body, headers } = ctx.request;
    const [userIfExists, isProUser] = await Promise.all([
      UserTable.findOne({ _id: user._id }),
      ProUserTable.findOne({ userId: user._id }),
    ]);
    if (!userIfExists) {
      return this.BadRequest(ctx, "User not found.");
    }
    if (
      isProUser?.subscriptionStartAt !=
      body.customerInfo.entitlements.active.premium.latestPurchaseDate
    ) {
      await UserDBService.updateUserSubscriptionStatus(userIfExists, body);
    }
    return this.Ok(ctx, { message: "Success" });
  }
}

export default new UserController();
