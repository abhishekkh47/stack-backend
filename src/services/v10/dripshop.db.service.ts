import { NetworkError } from "@app/middleware";
import {
  DripshopItemTable,
  UserEmployeesTable,
  UserTable,
  StreakRewardStatusTable,
  EmployeeTable,
  DripshopTable,
} from "@app/model";
import {
  EMP_STATUS,
  REWARD_TYPE,
  GIFTSTATUS,
  SEC_IN_DAY,
  CLAIMED_REWARD_IMAGES,
  ANALYTICS_EVENTS,
} from "@app/utility";
import moment from "moment";
import { AnalyticsService } from "../v4";
import { DripshopDBService as DripshopDBServiceV1 } from "@app/services/v1";
import { MilestoneDBService as MilestoneDBServiceV9 } from "../v9";
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
          this.updateClaimedReward(reward);
        } else {
          const rewardClaimedAt = rewardStatus?.rewardsClaimedAt;
          currentActiveDay = currentActiveDay || reward.day;
          nextRewardAvailableAt = nextRewardAvailableAt || rewardClaimedAt;

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
      if (!rewardStatus)
        return {
          streakRewardAvailableIn: null,
          available: true,
        };
      const { rewardsClaimedAt: rewardClaimedAt = 0, rewardDayClaimed = 0 } =
        rewardStatus;
      const streakRewardAvailableIn = (rewardClaimedAt + SEC_IN_DAY) * 1000;
      const nowUnix = moment().unix();
      const twoDaysAgoUnix = nowUnix - SEC_IN_DAY * 2;
      if (rewardClaimedAt < twoDaysAgoUnix || rewardDayClaimed >= 8) {
        return { streakRewardAvailableIn: null, available: false };
      }
      if (
        rewardClaimedAt + SEC_IN_DAY < nowUnix &&
        rewardClaimedAt > twoDaysAgoUnix
      ) {
        return { streakRewardAvailableIn, available: true };
      } else {
        return { streakRewardAvailableIn, available: false };
      }
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
      const { TOKEN, CASH, SCORE, EMPLOYEE, GIFT } = REWARD_TYPE;
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
          { upsert: true }
        );
      } else {
        switch (rewardType) {
          case TOKEN:
            rewardUpdate.quizCoins = reward;
            rewardUpdate["currentDayRewards.quizCoins"] = reward;
            break;
          case CASH:
            rewardUpdate.cash = reward;
            rewardUpdate["currentDayRewards.cash"] = reward;
            break;
          case SCORE:
            rewardUpdate["businessScore.current"] = reward;
            rewardUpdate["currentDayRewards.scoreProgress"] = reward;
            break;
          case GIFT:
            await this.redeemDripShop(userIfExists, rewardDetails, data);
            break;
          default:
            throw new Error("Reward not found");
        }
        await Promise.all([
          UserTable.findOneAndUpdate(
            { _id: userIfExists._id },
            { $inc: rewardUpdate }
          ),
        ]);
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

  /**
   * @description This service is used claim 8th day reward and send email to admin
   * @param userIfExists
   * @param rewardDetails
   * @param body
   */
  public async redeemDripShop(
    userIfExists: any,
    rewardDetails: any,
    body: any
  ) {
    const createdDripshop = await DripshopTable.create({
      firstName: body.firstName,
      lastName: body.lastName,
      redeemedFuels: 0,
      userId: userIfExists._id,
      itemId: rewardDetails._id,
      address: body.address,
      state: body.state,
      city: body.city,
      apartment: body.apartment || null,
      zipCode: body.zipCode,
      selectedSize: body.selectedSize || null,
    });
    /**
     * Amplitude Track Dripshop Redeemed Event
     */
    AnalyticsService.sendEvent(
      ANALYTICS_EVENTS.DRIP_SHOP_REDEEMED,
      {
        "Item Name": rewardDetails.name,
      },
      {
        user_id: userIfExists._id,
      }
    );
    await DripshopDBServiceV1.sendEmailToAdmin(
      createdDripshop,
      userIfExists,
      rewardDetails
    );

    return createdDripshop;
  }

  /**
   * @description Update image and status for claimed rewards
   * @param reward
   */
  private updateClaimedReward(reward: any) {
    reward["status"] = GIFTSTATUS.CLAIMED;
    switch (reward.rewardType) {
      case REWARD_TYPE.TOKEN:
        reward["image"] = CLAIMED_REWARD_IMAGES.TOKEN;
        break;
      case REWARD_TYPE.CASH:
        reward["image"] = CLAIMED_REWARD_IMAGES.CASH;
        break;
      case REWARD_TYPE.SCORE:
        reward["image"] =
          reward.day === 3
            ? CLAIMED_REWARD_IMAGES.SCORE_5
            : CLAIMED_REWARD_IMAGES.SCORE_10;
        break;
      case REWARD_TYPE.EMPLOYEE:
        reward["image"] = CLAIMED_REWARD_IMAGES.EMPLOYEE;
        break;
    }
  }
}

export default new DripshopDBService();
