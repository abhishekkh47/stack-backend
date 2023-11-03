import BaseController from "@app/controllers/base";
import { Auth } from "@app/middleware";
import { UserTable } from "@app/model";
import { UserDBService } from "@app/services/v6";
import { HttpMethod } from "@app/types";
import { Route } from "@app/utility";
import { BusinessProfileService } from "@app/services/v4";

class UserController extends BaseController {
  /**
   * @description This method is used to view profile for both parent and child
   * @param ctx
   */
  @Route({ path: "/get-profile/:id", method: HttpMethod.GET })
  @Auth()
  public async getProfile(ctx: any) {
    const { id } = ctx.request.params;
    if (!/^[0-9a-fA-F]{24}$/.test(id))
      return this.BadRequest(ctx, "Enter valid ID.");
    let { data } = await UserDBService.getProfile(id);
    const businessProfile = await BusinessProfileService.getBusinessProfile(id);

    data = {
      ...data,
      businessProfile,
    };

    return this.Ok(ctx, data, true);
  }
  /**
   * @description This method is used to refill the streak freeze
   * @param ctx
   * @returns {*}
   */
  @Route({
    path: "/refill-streak-freeze",
    method: HttpMethod.POST,
  })
  @Auth()
  public async refillStreakFreeze(ctx: any) {
    const { user } = ctx.request;
    const userIfExists = await UserTable.findOne({ _id: user._id });
    if (!userIfExists) {
      return this.BadRequest(ctx, "User not found");
    }
    await UserDBService.refillStreakFreezeWithFuel(userIfExists);
    return this.Ok(ctx, {
      message: "Success",
    });
  }
}

export default new UserController();
