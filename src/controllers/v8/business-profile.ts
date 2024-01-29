import { Auth } from "@app/middleware";
import { UserTable } from "@app/model";
import { HttpMethod } from "@app/types";
import { Route } from "@app/utility";
import BaseController from "../base";
import { BusinessProfileService } from "@app/services/v8";
class BusinessProfileController extends BaseController {
  /**
   * @description This method is get business profile information
   * @param ctx
   * @returns {*}
   */
  @Route({
    path: "/business-profile/:id",
    method: HttpMethod.GET,
  })
  @Auth()
  public async getBusinessProfile(ctx: any) {
    try {
      const { id } = ctx.request.params;
      if (!/^[0-9a-fA-F]{24}$/.test(id))
        return this.BadRequest(ctx, "Business Profile not found.");
      const userIfExists = await UserTable.findOne({ _id: id });
      if (!userIfExists) {
        return this.BadRequest(ctx, "User not found.");
      }
      const businessProfile = await BusinessProfileService.getBusinessProfile(
        id
      );
      return this.Ok(ctx, { data: businessProfile });
    } catch (error) {
      return this.BadRequest(ctx, error.message);
    }
  }
}

export default new BusinessProfileController();
