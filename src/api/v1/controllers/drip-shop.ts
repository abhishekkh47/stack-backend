import { EUSERSTATUS } from "./../../../types/user";
import { ObjectId } from "mongodb";
import { UserTable } from "./../../../model/user";
import { validation } from "./../../../validations/apiValidation";
import { DripShopTable } from "./../../../model/dripShop";
import BaseController from "./base";
import { Route } from "../../../utility";
import { Auth, PrimeTrustJWT } from "../../../middleware";
import { HttpMethod } from "../../../types";
import { DripshopDBService, UserDBService } from "../../../services/index";

class DripshopController extends BaseController {
  /**
   * @description THis method is used to get list of all products in drip shop
   * @param ctx
   */
  @Route({ path: "/dripshops", method: HttpMethod.GET })
  @Auth()
  public async getDripShopData(ctx: any) {
    /**
     * aggregate with crypto to get crypto image
     */
    const allData = await DripshopDBService.getDripshopQuery();

    return this.Ok(ctx, { data: allData });
  }

  /**
   * @description This method is used to redeem crypto for fuels
   * @param ctx
   * @return {*}
   */
  @Route({ path: "/redeem-crypto", method: HttpMethod.POST })
  @Auth()
  @PrimeTrustJWT(true)
  public async redeemCrypto(ctx: any) {
    const user = ctx.request.user;
    const jwtToken = ctx.request.primeTrustToken;
    let reqParam = ctx.request.body;
    return validation.redeemCryptoValidation(
      reqParam,
      ctx,
      async (validate: boolean) => {
        if (validate) {
          /**
           * get user info
           */
          const userExists = await UserDBService.getUserInfoQuery(user._id);

          if (!userExists) {
            return this.BadRequest(ctx, "User does not exist");
          }

          /**
           * get the drip shop information for specific drip shop id
           */
          let dripShopData = await DripshopDBService.dripShopInfoForId(
            reqParam.dripShopId
          );

          /**
           * service to update coins of user
           */
          const { updatedCoinQuery, updateParentCoinQuery } =
            await UserDBService.getUpdateCoinQuery(userExists, dripShopData);

          /**
           * internal transfer for redeeming crypto
           */
          await DripshopDBService.internalTransforDripShop(
            userExists._id,
            userExists.type,
            dripShopData,
            jwtToken
          );
          await UserTable.updateOne(
            {
              _id: userExists._id,
            },
            updatedCoinQuery
          );

          if (updateParentCoinQuery) {
            await UserTable.updateOne(
              {
                _id: userExists.parentId,
              },
              updateParentCoinQuery
            );
          }

          return this.Ok(ctx, { message: "Transaction Processed!" });
        }
      }
    );
  }
}

export default new DripshopController();
