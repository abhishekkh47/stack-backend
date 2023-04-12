import {
  deleteAccountInformationInZoho,
  searchAccountInfoByEmail,
} from "@app/utility/index";
import { NetworkError } from "@app/middleware/error.middleware";
import { UserTable } from "@app/model";

class UserDBService {
  /**
   * @description get latest onboarded parents
   */
  public async getLatestOnBoardedParents() {
    const parents = await UserTable.aggregate([
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $match: {
          type: 2,
          status: 0,
          mobile: { $ne: null },
          referralCode: { $ne: null },
          isParentOnboardingReminderSent: false,
        },
      },
    ]).exec();
    return parents;
  }

  /**
   * @description get prime trust balance
   * @param emails
   */
  public async getUserDetails(emails) {
    const users = await UserTable.aggregate([
      {
        $match: {
          type: 1,
          email: { $in: emails },
        },
      },
      {
        $lookup: {
          from: "parentchild",
          localField: "_id",
          foreignField: "teens.childId",
          as: "teenUser",
        },
      },
      {
        $unwind: {
          path: "$teenUser",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          email: 1,
          accountDetails: {
            $filter: {
              input: "$teenUser.teens",
              as: "list",
              cond: {
                $eq: ["$$list.childId", "$_id"],
              },
            },
          },
        },
      },
    ]).exec();
    if (users.length == 0) {
      throw new NetworkError("Users not found", 400);
    }
    return users;
  }

  /**
   * @description search zoho data and delete it
   * @param emails
   * @param zohoAccessToken
   */
  public async searchAndDeleteZohoAccounts(emails, zohoAccessToken) {
    const zohoCrmAccounts = await Promise.all(
      await emails.map(async (data: any) => {
        let crmAccount: any = await searchAccountInfoByEmail(
          zohoAccessToken,
          data
        );
        if (
          crmAccount.status == 200 &&
          crmAccount.data &&
          crmAccount.data.data.length > 0
        ) {
          await deleteAccountInformationInZoho(
            zohoAccessToken,
            crmAccount.data.data[0].id
          );
          return data;
        }
      })
    );
    return zohoCrmAccounts;
  }
}

export default new UserDBService();
