import { NetworkError } from "@app/middleware";
import {
  DripshopItemTable,
  UserEmployeesTable,
  UserTable,
  StreakRewardStatusTable,
  EmployeeTable,
} from "@app/model";
import { EMP_STATUS, REWARD_TYPE } from "@app/utility";
class DripshopDBService {
  /**
   * @description This is to update the DB if the user has visited employee page atleast once on current day
   * @param userIfExists
   */
  public async getStreakRewardList(userIfExists: any) {
    try {
      let currentActiveDay = 0,
        nextRewardAvailableAt = null;
      const [rewards, rewardStatus] = await Promise.all([
        DripshopItemTable.find(
          { type: 1 },
          { _id: 1, day: 1, name: 1, image: 1, reward: 1, rewardType: 1 }
        )
          .sort({ day: 1 })
          .lean(),
        StreakRewardStatusTable.findOne({ userId: userIfExists._id }),
      ]);
      rewards.forEach((reward) => {
        if (reward?.day <= rewardStatus?.rewardDayCaimed) {
          reward["claimed"] = true;
        } else {
          currentActiveDay =
            currentActiveDay == 0 ? reward.day : currentActiveDay;
          nextRewardAvailableAt = nextRewardAvailableAt
            ? nextRewardAvailableAt
            : rewardStatus?.rewardsClaimedAt;
          reward["claimed"] = false;
        }
      });
      return { rewards, currentActiveDay, nextRewardAvailableAt };
    } catch (error) {
      throw new NetworkError(error.message, 404);
    }
  }

  /**
   * @description This is to check if reward is available to claim or not
   * @param userIfExists
   */
  public async ifStreakRewardAvailable(userIfExists: any) {
    try {
      const rewardStatus = await Promise.all([
        StreakRewardStatusTable.findOne({ userId: userIfExists._id }),
      ]);
      if (!rewardStatus) return true;
      return;
    } catch (error) {
      throw new NetworkError(error.message, 404);
    }
  }

  /**
   * @description This is to update the reward claim status
   * @param userIfExists
   */
  public async claimStreakReward(userIfExists: any, data: any) {
    try {
      const { TOKEN, CASH, SCORE, EMPLOYEE } = REWARD_TYPE;
      const rewardDetails = await DripshopItemTable.findOne({ type: data.day });
      if (!rewardDetails) {
        throw new Error("Reward not found");
      }
      const { rewardType, reward } = rewardDetails;
      const rewardUpdate: Record<string, any> = {};

      if (rewardType == EMPLOYEE) {
        let employee = await EmployeeTable.aggregate([
          { $match: { name: reward } },
          {
            $lookup: {
              from: "employee_levels",
              foreignField: "employeeId",
              localField: "_id",
              as: "employeeLevel",
            },
          },
          {
            $unwind: {
              path: "$employeeLevel",
              preserveNullAndEmptyArrays: false,
            },
          },
          {
            $project: {
              _id: 1,
              level: "$employeeLevel.level",
              ratingValues: "$employeeLevel.ratingValues",
            },
          },
        ]).exec();
        await UserEmployeesTable.findOneAndUpdate(
          { userId: userIfExists._id, employeeId: employee[0]._id },
          {
            update: {
              $set: {
                userId: userIfExists._id,
                employeeId: employee[0]._id,
                currentLevel: 1,
                unlockedLevel: employee[0].level,
                currentRatings: employee[0].ratingValues,
                hiredAt: null,
                status: EMP_STATUS.UNLOCKED,
                isProEmployee: 1,
              },
            },
          },
          { upsert: true }
        );
      } else {
        switch (rewardType) {
          case TOKEN:
            rewardUpdate.quizCoins = reward;
            break;
          case CASH:
            rewardUpdate.cash = reward;
            break;
          case SCORE:
            rewardUpdate.score = reward;
            break;
          default:
            throw new Error("Reward not found");
        }
        await UserTable.findOneAndUpdate(
          { _id: userIfExists._id },
          { $inc: rewardUpdate }
        );
      }
      await StreakRewardStatusTable.findOneAndUpdate(
        { userId: userIfExists._id },
        {
          $set: {
            userId: userIfExists._id,
            rewardDayCaimed: data?.day,
            rewardsClaimedAt: new Date(),
          },
        },
        { upsert: true }
      );
      return;
    } catch (error) {
      throw new NetworkError(error.message, 404);
    }
  }
}

export default new DripshopDBService();
