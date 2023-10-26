import BaseController from "@app/controllers/base";
import { Route } from "@app/utility";
import { Auth } from "@app/middleware";
import { HttpMethod } from "@app/types";
import { UserTable } from "@app/model";
import { DripshopDBService } from "@app/services/v1/index";

class DripshopController extends BaseController {
  /**
   * @description THis method is used to get list of all products in drip shop
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/dripshop-items", method: HttpMethod.GET })
  @Auth()
  public async getDripshopItems(ctx: any) {
    const { user } = ctx.request;
    const userIfExists = await UserTable.findOne({ _id: user._id });
    if (!userIfExists) return this.BadRequest(ctx, "User not found");
    const allData = await DripshopDBService.getDripshopData(userIfExists);

    return this.Ok(ctx, { data: allData });
  }
}

export default new DripshopController();
