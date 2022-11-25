import { ObjectId } from "mongodb";
import { UserTable } from "./../model/user";

class UserDBService {
  /**
   * @description This service is used to get the user info for redeemption
   * @param userId
   */
  public async getUserInfoQuery(userId: any) {
    const queryFindUser = [
      {
        $match: {
          _id: new ObjectId(userId),
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

    let userExists: any = await UserTable.aggregate(queryFindUser).exec();

    userExists = userExists.length > 0 ? userExists[0] : null;

    return userExists;
  }

  /**
   * @description This service is used to update the fuels of user
   * @param userExists
   * @param dripShopData
   */
  public async getUpdateCoinQuery(userExists: any, dripShopData: any) {
    let totalChildFuels = userExists.preLoadedCoins + userExists.quizCoins;

    let updatedCoinQuery: any = {};
    let updateParentCoinQuery: any = null;

    if (totalChildFuels >= dripShopData.requiredFuels) {
      /**
       * once true check what to update preloaded or quiz coins or both
       */
      if (userExists.preLoadedCoins >= dripShopData.requiredFuels) {
        updatedCoinQuery = {
          ...updatedCoinQuery,
          $set: {
            preLoadedCoins:
              userExists.preLoadedCoins - dripShopData.requiredFuels,
          },
        };
      } else {
        /**
         * amountLeftAfterPreloaded - contains amount left after removal of preloaded coins from required fuels
         */
        let amountLeftAfterPreloaded =
          dripShopData.requiredFuels - userExists.preLoadedCoins;

        if (amountLeftAfterPreloaded <= userExists.quizCoins) {
          updatedCoinQuery = {
            ...updatedCoinQuery,
            $set: {
              preLoadedCoins: 0,
              quizCoins: userExists.quizCoins - amountLeftAfterPreloaded,
            },
          };
        }
      }
    } else if (
      userExists.parentQuizCoins &&
      totalChildFuels + userExists.parentQuizCoins >= dripShopData.requiredFuels
    ) {
      /**
       * amountLeftAfterTotalChildCoins - amount left after removal of preloaded and quiz coins from fuels
       */
      let amountLeftAfterTotalChildCoins =
        dripShopData.requiredFuels - totalChildFuels;

      if (amountLeftAfterTotalChildCoins <= userExists.parentQuizCoins) {
        updatedCoinQuery = {
          ...updatedCoinQuery,
          $set: { preLoadedCoins: 0, quizCoins: 0 },
        };

        updateParentCoinQuery = {
          ...updateParentCoinQuery,
          $set: {
            quizCoins:
              userExists.parentQuizCoins - amountLeftAfterTotalChildCoins,
          },
        };
      }
    } else {
      throw Error("ERROR: Insufficient Funds.");
    }

    return { updateParentCoinQuery, updatedCoinQuery };
  }
}

export default new UserDBService();
