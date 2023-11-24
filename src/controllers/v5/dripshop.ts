import BaseController from "@app/controllers/base";
import { Route, STREAK_FREEZE_NAME } from "@app/utility";
import { Auth } from "@app/middleware";
import { HttpMethod } from "@app/types";
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
    let allData = await DripshopDBService.getDripshopData();
    allData = allData.filter((item) => item.name !== STREAK_FREEZE_NAME);
    return this.Ok(ctx, { data: allData });
  }
}

export default new DripshopController();
