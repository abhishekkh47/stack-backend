import { ERECURRING } from "./../types/user";
import { ObjectId } from "mongodb";
import { UserTable } from "./../model/user";

class UserDBService {
  /**
   * @description This service is used to get the user info for redeemption
   * @param userId
   */
  public async getUserInfo(userId: any) {
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
   * @param dripshopData
   */
  public async getUpdateCoinQuery(userExists: any, dripshopData: any) {
    const { requiredFuels } = dripshopData;
    let totalChildFuels = userExists.preLoadedCoins + userExists.quizCoins;

    let updatedCoinQuery: any = {};
    let updateParentCoinQuery: any = null;

    if (totalChildFuels >= requiredFuels) {
      /**
       * once true check what to update preloaded or quiz coins or both
       */
      if (userExists.preLoadedCoins >= requiredFuels) {
        updatedCoinQuery = {
          ...updatedCoinQuery,
          $set: {
            preLoadedCoins: userExists.preLoadedCoins - requiredFuels,
          },
        };
      } else {
        /**
         * amountLeftAfterPreloaded - contains amount left after removal of preloaded coins from required fuels
         */
        let amountLeftAfterPreloaded =
          requiredFuels - userExists.preLoadedCoins;

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
      totalChildFuels + userExists.parentQuizCoins >= requiredFuels
    ) {
      /**
       * amountLeftAfterTotalChildCoins - amount left after removal of preloaded and quiz coins from fuels
       */
      let amountLeftAfterTotalChildCoins = requiredFuels - totalChildFuels;

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

  /**
   * @description This service is used to update all to no recurring
   * @userId
   */
  public async updateUserRecurring(userId: any) {
    let updateUserArray = [];
    const queryFindAllTeen = [
      {
        $match: {
          _id: new ObjectId(userId),
        },
      },
      {
        $lookup: {
          from: "parentchild",
          localField: "_id",
          foreignField: "userId",
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
        $project: {
          allTeens: {
            $ifNull: ["$parentInfo.teens", null],
          },
        },
      },
    ];

    let getAllTeens: any = await UserTable.aggregate(queryFindAllTeen);

    getAllTeens = getAllTeens.length > 0 ? getAllTeens[0] : null;
    updateUserArray.push(userId);
    if (getAllTeens.allTeens.length > 0) {
      await getAllTeens.allTeens.map((obj) => {
        updateUserArray.push(obj.childId.toString());
      });
    }

    await UserTable.updateMany(
      {
        _id: {
          $in: updateUserArray,
        },
      },
      {
        $set: {
          isRecurring: ERECURRING.NO_BANK,
          selectedDepositDate: null,
          selectedDeposit: null,
        },
      }
    );

    return true;
  }
}

export default new UserDBService();
