import { NetworkError } from "@app/middleware";
import {
  DripshopItemTable,
  UserEmployeesTable,
  UserTable,
  StreakRewardStatusTable,
  EmployeeTable,
} from "@app/model";
import { EMP_STATUS, REWARD_TYPE, GIFTSTATUS, SEC_IN_DAY } from "@app/utility";
import moment from "moment";
class DripshopDBService {
  /**
   * @description This is to update the DB if the user has visited employee page atleast once on current day
   * @param userIfExists
   */
  public async getStreakRewardList(userIfExists: any) {
    try {
      let currentActiveDay = 0,
        nextRewardAvailableAt = null,
        readyToClaim = false;
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
        if (reward?.day <= rewardStatus?.rewardDayClaimed) {
          reward["status"] = GIFTSTATUS.CLAIMED;
        } else {
          const rewardClaimedAt = rewardStatus?.rewardsClaimedAt;
          currentActiveDay =
            currentActiveDay == 0 ? reward.day : currentActiveDay;
          nextRewardAvailableAt = nextRewardAvailableAt
            ? nextRewardAvailableAt
            : rewardStatus?.rewardsClaimedAt;
          if (reward.day == 1 && !rewardClaimedAt) {
            reward["status"] = GIFTSTATUS.READY_TO_CLAIM;
          } else if (
            reward.day == rewardStatus?.rewardDayClaimed + 1 &&
            !readyToClaim
          ) {
            if (rewardClaimedAt > moment().unix() - SEC_IN_DAY) {
              reward["status"] = GIFTSTATUS.AVAILABLE_SOON;
              reward["availableIn"] = (rewardClaimedAt + SEC_IN_DAY) * 1000;
            } else {
              reward["status"] = GIFTSTATUS.READY_TO_CLAIM;
            }
            readyToClaim = true;
          } else {
            reward["status"] = GIFTSTATUS.NOT_AVAILABLE;
          }
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
      const rewardStatus = await StreakRewardStatusTable.findOne({
        userId: userIfExists._id,
      });
      if (!rewardStatus) return true;
      if (rewardStatus?.rewardsClaimedAt + SEC_IN_DAY < moment().unix())
        return true;
      else return false;
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
      const rewardDetails = await DripshopItemTable.findOne({
        type: 1,
        day: data.day,
      });
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
            rewardDayClaimed: data?.day,
            rewardsClaimedAt: moment().unix(),
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
