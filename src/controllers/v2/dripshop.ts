import { validations } from "../../validations/v2/apiValidation";
import { UserTable } from "../../model/user";
import BaseController from "../base";
import { Route } from "../../utility";
import { Auth, PrimeTrustJWT } from "../../middleware";
import { HttpMethod } from "../../types";
import { DripshopDBService, UserDBService } from "../../services/v1/index";

class DripshopController extends BaseController {
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
    return validations.redeemCryptoValidation(
      reqParam,
      ctx,
      async (validate: boolean) => {
        if (validate) {
          /**
           * get user info
           */
          let userExists = await UserDBService.getUserInfo(user._id);

          if (!userExists) {
            userExists = await UserDBService.getUserInfo(reqParam.userId);
          }
          if (!userExists) {
            return this.BadRequest(ctx, "User does not exist");
          }

          /**
           * get the drip shop information for specific drip shop id
           */
          let dripshopData = await DripshopDBService.dripshopInfoForId(
            reqParam.dripshopId
          );

          /**
           * service to update coins of user
           */
          const { updatedCoinQuery, updateParentCoinQuery } =
            await UserDBService.getUpdateCoinQuery(userExists, dripshopData);

          /**
           * internal transfer for redeeming crypto
           */
          await DripshopDBService.internalTransforDripshop(
            userExists._id,
            userExists.type,
            dripshopData,
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
