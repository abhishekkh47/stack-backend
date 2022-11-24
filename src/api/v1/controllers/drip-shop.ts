import { ObjectId } from "mongodb";
import { UserTable } from "./../../../model/user";
import { validation } from "./../../../validations/apiValidation";
import { DripShopTable } from "./../../../model/dripShop";
import BaseController from "./base";
import { Route } from "../../../utility";
import { Auth, PrimeTrustJWT } from "../../../middleware";
import { HttpMethod } from "../../../types";
import { dripShopService } from "../../../services/index";

class DripShopController extends BaseController {
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
    const getDataQuery = [
      {
        $lookup: {
          from: "cryptos",
          localField: "cryptoId",
          foreignField: "_id",
          as: "cryptoInfo",
        },
      },
      {
        $unwind: { path: "$cryptoInfo", preserveNullAndEmptyArrays: true },
      },
      {
        $redact: {
          $cond: {
            if: {
              $ne: ["$cryptoInfo.disabled", true],
            },
            then: "$$KEEP",
            else: "$$PRUNE",
          },
        },
      },
      {
        $project: {
          cryptoId: 1,
          assetId: 1,
          requiredFuels: 1,
          cryptoToBeRedeemed: 1,
          cryptoName: "$cryptoInfo.name",
          image: { $ifNull: ["$cryptoInfo.image", null] },
        },
      },
    ];

    let getAllData = await DripShopTable.aggregate(getDataQuery).exec();

    return this.Ok(ctx, { data: getAllData });
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
          const findUserInfoQuery = [
            {
              $match: {
                _id: new ObjectId(user._id),
              },
            },
            {
              $lookup: {
                from: "parentchild",
                localField: "_id",
                foreignField: "teens.childId",
                as: "parentId",
              },
            },
            {
              $unwind: {
                path: "$parentId",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "parentId.userId",
                foreignField: "_id",
                as: "parentInfo",
              },
            },
            {
              $unwind: {
                path: "$parentInfo",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $addFields: {
                parentId: {
                  $ifNull: ["$parentId.userId", null],
                },
                parentQuizCoins: {
                  $ifNull: ["$parentInfo.quizCoins", 0],
                },
              },
            },
            {
              $project: {
                parentId: 1,
                accountId: 1,
                preLoadedCoins: 1,
                type: 1,
                quizCoins: 1,
                parentQuizCoins: 1,
              },
            },
          ];

          let userExists: any = await UserTable.aggregate(
            findUserInfoQuery
          ).exec();

          userExists = userExists.length > 0 ? userExists[0] : null;

          if (!userExists) {
            return this.BadRequest(ctx, "User does not exist");
          }

          /**
           * get the drip shop information for specific drip shop id
           */
          let dripShopData = await dripShopService.dripShopInfoForId(
            reqParam.dripShopId
          );
          let totalChildFuels =
            userExists.preLoadedCoins + userExists.quizCoins;

          let updateQuery = {};

          if (totalChildFuels >= dripShopData.requiredFuels) {
            /**
             * once true check what to update preloaded or quiz coins or both
             */
            if (userExists.preLoadedCoins >= dripShopData.requiredFuels) {
              updateQuery = {
                ...updateQuery,
                preLoadedCoins:
                  userExists.preLoadedCoins - dripShopData.requiredFuels,
              };
            } else {
              /**
               * amountLeftAfterPreloaded - contains amount left after removal of preloaded coins from required fuels
               */
              let amountLeftAfterPreloaded =
                dripShopData.requiredFuels - userExists.preLoadedCoins;

              if (amountLeftAfterPreloaded <= userExists.quizCoins) {
                updateQuery = {
                  ...updateQuery,
                  preLoadedCoins: 0,
                  quizCoins: userExists.quizCoins - amountLeftAfterPreloaded,
                };
              }
            }
          } else if (
            userExists.parentQuizCoins &&
            totalChildFuels + userExists.parentQuizCoins >=
              dripShopData.requiredFuels
          ) {
            /**
             * amountLeftAfterTotalChildCoins - amount left after removal of preloaded and quiz coins from fuels
             */
            let amountLeftAfterTotalChildCoins =
              dripShopData.requiredFuels - totalChildFuels;

            if (amountLeftAfterTotalChildCoins <= userExists.parentQuizCoins) {
              updateQuery = {
                ...updateQuery,
                preLoadedCoins: 0,
                quizCoins: 0,
              };

              await UserTable.updateOne(
                {
                  _id: userExists.parentId,
                },
                {
                  $set: {
                    quizCoins:
                      userExists.parentQuizCoins -
                      amountLeftAfterTotalChildCoins,
                  },
                }
              );
            }
          } else {
            return this.BadRequest(ctx, "ERROR: Insufficient Funds");
          }

          /**
           * internal transfer for redeeming crypto
           */
          await dripShopService.internalTransforDripShop(
            userExists._id,
            userExists.type,
            dripShopData,
            jwtToken
          );
          await UserTable.updateOne(
            {
              _id: userExists._id,
            },
            {
              $set: updateQuery,
            }
          );

          return this.Ok(ctx, { message: "Transaction Processed!" });
        }
      }
    );
  }
}

export default new DripShopController();
