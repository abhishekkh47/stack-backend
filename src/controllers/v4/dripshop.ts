import { validationsV4 } from "@app/validations/v4/apiValidation";
import { UserTable } from "@app/model/user";
import BaseController from "@app/controllers/base";
import { Route } from "@app/utility";
import { Auth, PrimeTrustJWT } from "@app/middleware";
import { HttpMethod } from "@app/types";
import { DripshopDBService } from "@app/services/v1/index";
import { UserDBService } from "@app/services/v4/index";
import { DripshopItemTable } from "@app/model";
import { REFILL_HEARTS_ITEM_NAME } from "@app/utility/constants";

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
    allData = allData.filter((item) => item.name !== REFILL_HEARTS_ITEM_NAME);
    return this.Ok(ctx, { data: allData });
  }

  /**
   * @description THis method is used to
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/dripshop-items/:itemId/redeem", method: HttpMethod.POST })
  @Auth()
  public async redeemDripshopItems(ctx: any) {
    try {
      const { user, body, params } = ctx.request;
      const userExists = await UserTable.findOne({
        _id: user._id,
      });
      if (!userExists) {
        return this.BadRequest(ctx, "User not found");
      }
      const itemExists = await DripshopItemTable.findOne({
        _id: params.itemId,
      });
      if (!itemExists) {
        return this.BadRequest(ctx, "Product not found");
      }
      return validationsV4.dripShopValidation(
        body,
        ctx,
        async (validate: boolean) => {
          if (validate) {
            const { createdDripshop, updatedUser } =
              await UserDBService.redeemDripShop(userExists, itemExists, body);
            await DripshopDBService.sendEmailToAdmin(
              createdDripshop,
              userExists,
              itemExists
            );
            const totalFuels =
              updatedUser.preLoadedCoins + updatedUser.quizCoins;

            return this.Ok(ctx, {
              message: "Your reward is on the way",
              data: { createdDripshop, totalFuels },
            });
          }
        }
      );
    } catch (error) {
      return this.BadRequest(ctx, error.message);
    }
  }
}

export default new DripshopController();
