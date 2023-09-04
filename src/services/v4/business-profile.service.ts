import {
  BusinessProfileTable,
  ImpactTable,
  PassionTable,
  StreakGoalTable,
  UserTable,
} from "@app/model";
import { NetworkError } from "@app/middleware";
import { ObjectId } from "mongodb";
import {
  LEVELS,
  convertDateToTimeZone,
  getDaysBetweenDates,
  formattedDate,
} from "@app/utility";
import { UserDBService } from "../v4/index";

class BusinessProfileService {
  /**
   * @description get latest onboarded parents
   */
  public async addOrEditBusinessProfile(data: any, userId: string) {
    try {
      const impactIfExists = await ImpactTable.findOne({
        _id: data.impacts,
      });
      if (!impactIfExists) throw new NetworkError("Impact not found", 400);
      const passionIfExists = await PassionTable.find({
        _id: data.passions,
      });
      if (
        passionIfExists.length === 0 ||
        data.passions.length !== passionIfExists.length
      )
        throw new NetworkError("Passions not found", 400);
      await BusinessProfileTable.findOneAndUpdate(
        {
          userId: userId,
        },
        {
          $set: {
            impacts: impactIfExists._id,
            passions: data.passions,
            description: data.description,
          },
        },
        { upsert: true }
      );
      return true;
    } catch (error) {
      throw new NetworkError("Something went wrong", 400);
    }
  }

  public async getBusinessProfile(id: string) {
    let businessProfile: any = await BusinessProfileTable.aggregate([
      {
        $match: {
          userId: new ObjectId(id),
        },
      },
      {
        $lookup: {
          from: "impacts",
          localField: "impacts",
          foreignField: "_id",
          as: "impacts",
        },
      },
      {
        $unwind: {
          path: "$impacts",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$passions",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "passions",
          localField: "passions",
          foreignField: "_id",
          as: "passions",
        },
      },
      {
        $unwind: {
          path: "$passions",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userData",
        },
      },
      {
        $unwind: {
          path: "$userData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: "$_id",
          userId: {
            $first: "$userId",
          },
          description: {
            $first: "$description",
          },
          streakGoal: {
            $first: "$streakGoal",
          },
          impacts: {
            $first: {
              _id: "$impacts._id",
              title: "$impacts.title",
              image: "$impacts.image",
            },
          },
          passions: {
            $addToSet: {
              _id: "$passions._id",
              title: "$passions.title",
              image: "$passions.image",
            },
          },
          streak: {
            $first: "$userData.streak",
          },
          timezone: {
            $first: "$userData.timezone",
          },
        },
      },
    ]).exec();
    if (businessProfile.length === 0) return null;
    businessProfile = businessProfile[0];
    if (!businessProfile.streak) {
      return businessProfile;
    }
    const currentDate = convertDateToTimeZone(
      new Date(),
      businessProfile.timezone
    );
    const isFirstStreak =
      !businessProfile || businessProfile?.streak?.updatedDate?.day === 0;
    const { year, month, day } = businessProfile.streak.updatedDate;
    const startDate = formattedDate(year, month, day);
    const endDate = new Date(currentDate.date);
    const difference = getDaysBetweenDates(startDate, endDate);
    if (isFirstStreak || (!isFirstStreak && difference <= 1)) {
    } else {
      let previousDate: any = endDate.setDate(endDate.getDate() - 1);
      previousDate = convertDateToTimeZone(
        new Date(previousDate),
        businessProfile.timezone
      );
      const reset5daysStreaks = [null, null, null, null, null];
      const last5days = UserDBService.modifyLast5DaysStreaks(
        difference,
        businessProfile.streak.last5days,
        reset5daysStreaks,
        false
      );
      const streak = {
        current: 0,
        longest: businessProfile.streak.longest,
        updatedDate: {
          day: previousDate.day,
          month: previousDate.month,
          year: previousDate.year,
        },
        last5days,
      };
      await UserTable.findOneAndUpdate(
        { _id: id },
        {
          $set: {
            streak: streak,
          },
        },
        { upsert: true }
      );
    }
    /**
     * Achievements
     */
    let achievements = {};
    const longestStreak = businessProfile?.streak?.longest || 0;
    if (longestStreak >= LEVELS.LEVEL6.maxValue) {
      const additionalLevels =
        Math.floor((longestStreak - LEVELS.LEVEL6.maxValue) / 50) + 1;
      const level = 7 + additionalLevels;
      const maxValue = LEVELS.LEVEL6.maxValue + additionalLevels * 50;

      achievements = {
        ...achievements,
        level,
        longestStreak,
        maxValue,
      };
    } else {
      switch (true) {
        case longestStreak < LEVELS.LEVEL1.maxValue:
          achievements = {
            ...achievements,
            level: LEVELS.LEVEL1.level,
            longestStreak,
            maxValue: LEVELS.LEVEL1.maxValue,
          };
          break;
        case longestStreak < LEVELS.LEVEL2.maxValue:
          achievements = {
            ...achievements,
            level: LEVELS.LEVEL2.level,
            longestStreak,
            maxValue: LEVELS.LEVEL2.maxValue,
          };
          break;
        case longestStreak < LEVELS.LEVEL3.maxValue:
          achievements = {
            ...achievements,
            level: LEVELS.LEVEL3.level,
            longestStreak,
            maxValue: LEVELS.LEVEL3.maxValue,
          };
          break;
        case longestStreak < LEVELS.LEVEL4.maxValue:
          achievements = {
            ...achievements,
            level: LEVELS.LEVEL4.level,
            longestStreak,
            maxValue: LEVELS.LEVEL4.maxValue,
          };
          break;
        case longestStreak < LEVELS.LEVEL5.maxValue:
          achievements = {
            ...achievements,
            level: LEVELS.LEVEL5.level,
            longestStreak,
            maxValue: LEVELS.LEVEL5.maxValue,
          };
          break;
        case longestStreak < LEVELS.LEVEL6.maxValue:
          achievements = {
            ...achievements,
            level: LEVELS.LEVEL6.level,
            longestStreak,
            maxValue: LEVELS.LEVEL6.maxValue,
          };
          break;
      }
    }
    businessProfile = { ...businessProfile, achievements };
    return businessProfile;
  }

  /**
   * @description This method is used to set streak goals
   * @param userId
   * @param streakGoalId
   * @returns {*}
   */
  public async setStreakGoal(userId: string, streakGoalId: string) {
    try {
      const streakGoalsIfExists = await StreakGoalTable.findOne({
        _id: streakGoalId,
      });
      if (!streakGoalsIfExists) {
        throw new NetworkError("No Streak Goal Found", 400);
      }
      await BusinessProfileTable.findOneAndUpdate(
        { userId: userId },
        {
          $set: {
            streakGoal: streakGoalId,
          },
        }
      );
      return true;
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }
}

export default new BusinessProfileService();
