import { NetworkError } from "@app/middleware/error.middleware";
import { UserTable } from "@app/model";
import { ObjectId } from "mongodb";
import {
  convertDateToTimeZone,
  getDaysBetweenDates,
  ALL_NULL_5_DAYS,
  DEFAULT_TIMEZONE,
  DEFAULT_LIFE_COUNT,
  MAX_STREAK_FREEZE,
  STREAK_FREEZE_FUEL,
} from "@app/utility";
import { UserDBService as UserDBServiceV4 } from "../v4";

class UserDBService {
  /**
   * @description Get Profile of users
   * @param userId
   */
  public async getProfile(userId: string) {
    let data = (
      await UserTable.aggregate([
        { $match: { _id: new ObjectId(userId) } },
        {
          $lookup: {
            from: "business-profiles",
            localField: "_id",
            foreignField: "userId",
            as: "businessProfile",
          },
        },
        {
          $unwind: {
            path: "$businessProfile",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "streak_goals",
            localField: "streakGoal",
            foreignField: "_id",
            as: "streakGoal",
          },
        },
        {
          $unwind: {
            path: "$streakGoal",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "user-refferals",
            localField: "_id",
            foreignField: "userId",
            as: "lifeTimeReferral",
          },
        },
        {
          $unwind: {
            path: "$lifeTimeReferral",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            email: 1,
            mobile: 1,
            firstName: 1,
            lastName: 1,
            type: 1,
            parentMobile: 1,
            parentEmail: 1,
            lifeTimeReferralCount: {
              $ifNull: ["$lifeTimeReferral.referralCount", 0],
            },
            referralCode: 1,
            streakGoal: {
              _id: "$streakGoal._id",
              day: "$streakGoal.day",
            },
            isOnboardingQuizCompleted: 1,
            dob: 1,
            profilePicture: 1,
            isNotificationOn: 1,
            isPhoneVerified: 1,
            quizCoins: 1,
            preLoadedCoins: 1,
            xpPoints: 1,
            timezone: 1,
            streak: 1,
            referralSource: 1,
            lifeCount: 1,
            renewLifeAt: 1,
            streakFreezeCount: 1,
          },
        },
      ]).exec()
    )[0];
    if (!data) {
      throw Error("Invalid user ID entered.");
    }
    if (data.streak) {
      const currentDate = convertDateToTimeZone(
        new Date(),
        data?.timezone || DEFAULT_TIMEZONE
      );
      const { day } = data.streak?.updatedDate;
      const isFirstStreak = day === 0;
      const diffDays = getDaysBetweenDates(
        data.streak?.updatedDate,
        currentDate
      );
      let streakFreezeEquipped =
        data.streakFreezeCount === 0
          ? 0
          : diffDays > 2
          ? data.streakFreezeCount
          : 1;
      if (!(isFirstStreak || diffDays <= 1)) {
        const endDate = new Date(currentDate.date);
        let previousDate: any = new Date(
          endDate.setDate(endDate.getDate() - 1)
        );
        previousDate = {
          ...previousDate,
          day: previousDate.getDate(),
          month: previousDate.getMonth() + 1,
          year: previousDate.getFullYear(),
        };
        const { last5days, isStreakInactive5Days } =
          UserDBServiceV4.modifyLast5DaysStreaks(
            diffDays,
            data.streak.last5days,
            ALL_NULL_5_DAYS,
            false,
            streakFreezeEquipped
          );
        const streak = {
          current:
            diffDays - streakFreezeEquipped <= 1 ? data.streak.current : 0,
          longest: data.streak.longest,
          updatedDate: previousDate,
          isStreakInactive5Days,
          last5days,
        };
        let updateStreakQuery: any = {
          streak,
          streakFreezeCount: data.streakFreezeCount - streakFreezeEquipped,
        };
        if (isStreakInactive5Days) {
          updateStreakQuery = {
            ...updateStreakQuery,
            streakGoal: null,
          };
        }
        await UserTable.findOneAndUpdate(
          { _id: data._id },
          {
            $set: updateStreakQuery,
          },
          { upsert: true }
        );
      }
      const achievements = UserDBServiceV4.getUserStreaksAchievements(
        data.streak.longest
      );
      data = { ...data, achievements };
    }
    if (data.lifeCount !== DEFAULT_LIFE_COUNT) {
      const updatedData = await UserDBServiceV4.getUsersLatestLifeData(data);
      if (updatedData) {
        data = {
          ...data,
          ...updatedData,
        };
      }
    }

    return { data };
  }
  /**
   * @description This method is used to refill all streakFreeze in exchange of fuel.
   * @param user
   * @returns {*}
   */
  public async refillStreakFreezeWithFuel(user: any) {
    if (user.streakFreezeCount >= MAX_STREAK_FREEZE) {
      throw new NetworkError(
        `You already have ${MAX_STREAK_FREEZE} streak freeze`,
        400
      );
    }
    const fuelToBeDeducted =
      user.streakFreezeCount === 0
        ? STREAK_FREEZE_FUEL
        : STREAK_FREEZE_FUEL / 2;
    const totalFuels = user.quizCoins + user.preLoadedCoins;
    if (totalFuels < fuelToBeDeducted) {
      throw new NetworkError(
        "You dont have sufficient fuels to refill streak freeze",
        400
      );
    }
    let updateQuery: any = { streakFreezeCount: MAX_STREAK_FREEZE };
    if (totalFuels >= fuelToBeDeducted) {
      /**
       * once true check what to update preloaded or quiz coins or both
       */
      if (user.preLoadedCoins >= fuelToBeDeducted) {
        updateQuery = {
          ...updateQuery,
          preLoadedCoins: user.preLoadedCoins - fuelToBeDeducted,
        };
      } else {
        const amountLeftAfterPreloaded = fuelToBeDeducted - user.preLoadedCoins;

        if (amountLeftAfterPreloaded <= user.quizCoins) {
          updateQuery = {
            ...updateQuery,
            preLoadedCoins: 0,
            quizCoins: user.quizCoins - amountLeftAfterPreloaded,
          };
        }
      }
    }
    await UserTable.findOneAndUpdate(
      {
        _id: user._id,
      },
      {
        $set: updateQuery,
      }
    );
    return true;
  }
}

export default new UserDBService();
