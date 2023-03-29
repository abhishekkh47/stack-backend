import { UserTable } from "../../model";

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
}

export default new UserDBService();
