import { ObjectId } from "mongodb";
import { EDEFAULTBANK } from "../../types/userBanks";
import { UserBanksTable } from "../../model/userBanks";
import { EUserType } from "../../types";

class UserBankDBService {
  /**
   * @description This service is used to get the user info and user bank info
   * @param userId,
   * @param bankId
   */
  public async getUserBankAccessToken(userId: any, bankId: any) {
    const queryFindUserBank = [
      {
        $match: {
          userId: new ObjectId(userId),
          _id: new ObjectId(bankId),
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

    if (userBankExists && userBankExists.userType === EUserType.TEEN) {
      throw Error("Not authorised for teen");
    }
    if (!userBankExists) {
      throw Error("Bank does not exist");
    }

    return userBankExists.accessToken;
  }
}

export default new UserBankDBService();
