import { EAction, EStatus } from "./../../../types/useractivity";
import { NOTIFICATION } from "./../../../utility/constants";
import { UserActivityTable } from "./../../../model/useractivity";
import {
  ETransactionType,
  ETransactionStatus,
} from "./../../../types/transaction";
import { TransactionTable } from "./../../../model/transactions";
import { EUserType } from "./../../../types/user";
import { ObjectId } from "mongodb";
import { UserTable } from "./../../../model/user";
import { validation } from "./../../../validations/apiValidation";
import { DripShopTable } from "./../../../model/dripShop";
import BaseController from "./base";
import { Route } from "../../../utility";
import { Auth, PrimeTrustJWT } from "../../../middleware";
import { HttpMethod } from "../../../types";
import { dripShopService, quizService } from "../../../services/index";

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

    return this.Ok(ctx, { data: getAllData || [] });
  }

  /**
   * @description This method is used to redeem crypto for fuels
   * @param ctx
   * @return {*}
   */
  @Route({ path: "/redeem-crypto", method: HttpMethod.POST })
  // @Auth()
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
          let internalTransfer;

          /**
           * The query to find the users and it's respective parent info in case of teen or if self only self info
           */
          const findUserInfoQuery = [
            {
              $match: {
                _id: new ObjectId("637c8fa2dd8aadd5fff08ea1"),
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
                localField: "parentId",
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
                  $isNull: ["$parentInfo.quizCoins", 0],
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

          /**
           * get the drip shop information for specific drip shop id
           */
          let dripShopData = await dripShopService.dripShopInfoForId(
            reqParam.dripShopId
          );

          /**
           * the total of preloaded and quiz points
           */
          let totalChildFuels =
            userExists.preLoadedCoins + userExists.quizCoins;

          let flag = false; // set true when conditions fulfill
          let updateQuery = {};

          if (totalChildFuels >= dripShopData.requiredFuels) {

            /**
             * once true check what to update preloaded or quiz coins or both
             */
            flag = true;
            if (userExists.preLoadedCoins === dripShopData.requiredFuels) {
              updateQuery = {
                ...updateQuery,
                $set: {
                  preLoadedCoins: 0,
                },
              };
            } else {

              /**
               * remainingAmountBeforeQuiz - contains amount left after removal of preloaded coins fron required fuels
               */
              let remainingAmountBeforeQuiz =
                dripShopData.requiredFuels - userExists.preLoadedCoins;
                
              if (remainingAmountBeforeQuiz === userExists.quizCoins) {
                updateQuery = {
                  ...updateQuery,
                  $set: {
                    preLoadedCoins: 0,
                    quizCoins: 0,
                  },
                };
              } else {
                let quizCoinsRemaining =
                  userExists.quizCoins - remainingAmountBeforeQuiz;
                updateQuery = {
                  ...updateQuery,
                  $set: {
                    preLoadedCoins: 0,
                    quizCoins: quizCoinsRemaining,
                  },
                };
              }
            }
          } else if (
            userExists.parentQuizCoins &&
            totalChildFuels + userExists.parentQuizCoins >=
              dripShopData.requiredFuels
          ) {
            flag = true;
            let getRemainingAmount =
              dripShopData.requiredFuels - totalChildFuels;
            if (getRemainingAmount === userExists.parentQuizCoins) {
              console.log("in first parent");
              updateQuery = {
                ...updateQuery,
                $set: {
                  preLoadedCoins: 0,
                  quizCoins: 0,
                },
              };

              await UserTable.updateOne(
                {
                  _id: userExists.parentId,
                },
                {
                  $set: {
                    quizCoins: 0,
                  },
                }
              );
            } else {
              console.log("in second parent");
              let coinsRemaining =
                userExists.parentQuizCoins - getRemainingAmount;
              updateQuery = {
                ...updateQuery,
                $set: {
                  preLoadedCoins: 0,
                  quizCoins: 0,
                },
              };
              await UserTable.updateOne(
                {
                  _id: userExists.parentId,
                },
                {
                  $set: {
                    quizCoins: coinsRemaining,
                  },
                }
              );
            }
          } else {
            return this.BadRequest(ctx, "ERROR: Insufficient Funds");
          }

          if (flag) {
            internalTransfer = await dripShopService.internalTransferDripShop(
              userExists._id,
              userExists.type,
              dripShopData,
              jwtToken
            );
            await UserTable.updateOne(
              {
                _id: userExists._id,
              },
              updateQuery
            );

            if (internalTransfer.responseStatus) {
              return this.Ok(ctx, { message: "Transaction Processed!" });
            }
          }
        }
      }
    );
  }
}

export default new DripShopController();
