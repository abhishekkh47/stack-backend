import { Auth } from "@app/middleware";
import { UserTable } from "@app/model";
import { HttpMethod } from "@app/types";
import { Route } from "@app/utility";
import { validationsV7 } from "@app/validations/v7/apiValidation";
import BaseController from "../base";
import { BusinessProfileService } from "@app/services/v7";

class BusinessProfileController extends BaseController {
  /**
   * @description This method is add/edit business profile information
   * @param ctx
   * @returns {*}
   */
  @Route({
    path: "/business-information",
    method: HttpMethod.POST,
  })
  @Auth()
  public async storeBusinessProfile(ctx: any) {
    try {
      const { body, user } = ctx.request;
      const userIfExists = await UserTable.findOne({ _id: user._id });
      if (!userIfExists) return this.BadRequest(ctx, "User not found");
      return validationsV7.businessProfileValidation(
        body,
        ctx,
        async (validate: boolean) => {
          if (validate) {
            await BusinessProfileService.addOrEditBusinessProfile(
              body,
              userIfExists._id
            );
            return this.Ok(ctx, { message: "Success" });
          }
        }
      );
    } catch (error) {
      return this.BadRequest(ctx, error.message);
    }
  }

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
