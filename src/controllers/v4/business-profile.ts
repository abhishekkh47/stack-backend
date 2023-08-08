import { Auth } from "@app/middleware";
import { ImpactTable, InterestTable } from "@app/model";
import { HttpMethod } from "@app/types";
import { Route } from "@app/utility";
import BaseController from "../base";

class BusinessProfileController extends BaseController {
  /**
   * @description This method is get impacts and interests for business profile information
   * @param ctx
   * @returns {*}
   */
  @Route({
    path: "/business/impact-interest-list",
    method: HttpMethod.GET,
  })
  @Auth()
  public async getBusinessProfileList(ctx: any) {
    const impacts = await ImpactTable.find({})
      .select("_id order image title")
      .sort({ order: 1 });
    const interests = await InterestTable.find({})
      .select("_id order image title")
      .sort({ order: 1 });
    return this.Ok(ctx, { message: "Success", data: { impacts, interests } });
  }
}

export default new BusinessProfileController();
