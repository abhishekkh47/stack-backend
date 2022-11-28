import { EDEFAULTBANK } from "./../types/userBanks";
import { UserBanksTable } from "./../model/userBanks";
import { ObjectId } from "mongodb";
import { UserTable } from "./../model/user";
import { EUserType } from "../types";

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
   * @description This service is used to get the user info and user bank info
   *  @param userId,
   * @param bankId
   */
  public async getUserBankInfo(userId: any, bankId: any) {
    const queryFindUserBank = [
      {
        $match: {
          userId: userId,
          _id: bankId,
          isDefault: EDEFAULTBANK.TRUE,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      {
        $unwind: { path: "$userInfo", preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          accessToken: 1,
          userType: "$userInfo.type",
        },
      },
    ];
    let userBankExists: any = await UserBanksTable.aggregate(queryFindUserBank);

    userBankExists = userBankExists.length > 0 ? userBankExists[0] : null;

    if (userBankExists.userType === EUserType.TEEN) {
      throw Error("Not authorised for teen");
    }

    return userBankExists;
  }
}

export default new UserDBService();
