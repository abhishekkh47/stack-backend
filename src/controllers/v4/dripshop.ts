import { validationsV4 } from "@app/validations/v4/apiValidation";
import { UserTable } from "@app/model/user";
import BaseController from "@app/controllers/base";
import { Route } from "@app/utility";
import { Auth, PrimeTrustJWT } from "@app/middleware";
import { HttpMethod } from "@app/types";
import { DripshopDBService } from "@app/services/v1/index";
import { UserDBService } from "@app/services/v4/index";
import { ProductTable } from "@app/model";

class DripshopController extends BaseController {
  /**
   * @description THis method is used to get list of all products in drip shop
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/dripshop-items", method: HttpMethod.GET })
  @Auth()
  public async getDripshopItems(ctx: any) {
    const user = await UserTable.findOne({ _id: ctx.request.user._id });
    if (!user) return this.BadRequest(ctx, "User Not found");
    const totalFuelOfUser = user.preLoadedCoins + user.quizCoins;
    const allData = await DripshopDBService.getDripshopData(totalFuelOfUser);

    return this.Ok(ctx, { data: allData });
  }

  /**
   * @description THis method is used to
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/dripshop", method: HttpMethod.POST })
  // @Auth()
  public async redeemDripshopItems(ctx: any) {
    try {
      const { user, body } = ctx.request;
      const userExists = await UserTable.findOne({
        _id: "63621959efd9812a8dba3247",
      });
      if (!userExists) {
        return this.BadRequest(ctx, "User not found");
      }
      return validationsV4.dripShopValidation(
        body,
        ctx,
        async (validate: boolean) => {
          if (validate) {
            const productExists = await ProductTable.findOne({
              _id: body.productId,
            });
            if (!productExists) {
              return this.BadRequest(ctx, "Product not found");
            }
            const dripshopDetails = await UserDBService.redeemDripShop(
              userExists,
              productExists,
              body
            );

            return this.Ok(ctx, {
              message: "Your reward is on the way",
              data: dripshopDetails,
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
