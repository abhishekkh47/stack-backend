import { Auth } from "@app/middleware";
import {
  BusinessProfileTable,
  ImpactTable,
  PassionTable,
  UserTable,
} from "@app/model";
import { HttpMethod } from "@app/types";
import { Route } from "@app/utility";
import { validationsV4 } from "@app/validations/v4/apiValidation";
import BaseController from "../base";
import { ObjectId } from "mongodb";
import { BusinessProfileService } from "@app/services/v4";

class BusinessProfileController extends BaseController {
  /**
   * @description This method is get impacts for business profile information
   * @param ctx
   * @returns {*}
   */
  @Route({
    path: "/impacts",
    method: HttpMethod.GET,
  })
  @Auth()
  public async getImpacts(ctx: any) {
    const impacts = await ImpactTable.find({})
      .select("_id order image title")
      .sort({ order: 1 });
    return this.Ok(ctx, { message: "Success", data: impacts });
  }

  /**
   * @description This method is get passions for business profile information
   * @param ctx
   * @returns {*}
   */
  @Route({
    path: "/passions",
    method: HttpMethod.GET,
  })
  @Auth()
  public async getPassions(ctx: any) {
    const passions = await PassionTable.find({})
      .select("_id order image title")
      .sort({ order: 1 });
    return this.Ok(ctx, { message: "Success", data: passions });
  }

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
      return validationsV4.businessProfileValidation(
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
}

export default new BusinessProfileController();
