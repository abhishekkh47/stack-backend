import { Auth } from "@app/middleware";
import { ImpactTable, InterestTable } from "@app/model";
import { HttpMethod } from "@app/types";
import { Route } from "@app/utility";
import BaseController from "../base";

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
   * @description This method is get interests for business profile information
   * @param ctx
   * @returns {*}
   */
  @Route({
    path: "/interests",
    method: HttpMethod.GET,
  })
  @Auth()
  public async getInterests(ctx: any) {
    const interests = await InterestTable.find({})
      .select("_id order image title")
      .sort({ order: 1 });
    return this.Ok(ctx, { message: "Success", data: interests });
  }
}

export default new BusinessProfileController();
