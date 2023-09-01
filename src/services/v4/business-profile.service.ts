import {
  BusinessProfileTable,
  ImpactTable,
  PassionTable,
  StreakGoalTable,
} from "@app/model";
import { NetworkError } from "@app/middleware";
import { ObjectId } from "mongodb";
import {
  LEVELS,
  convertDateToTimeZone,
  getDaysBetweenDates,
  formattedDate,
} from "@app/utility";

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

  public async getBusinessProfile(id: string, statistics: any) {
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
            $first: "$streak",
          },
          timezone: {
            $first: "$userData.timezone",
          },
        },
      },
    ]).exec();
    if (businessProfile.length === 0) return null;
    businessProfile = businessProfile[0];
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
      statistics = {
        ...statistics,
        activeStreak: businessProfile?.streak?.current,
      };
    } else {
      let previousDate: any = endDate.setDate(endDate.getDate() - 1);
      previousDate = convertDateToTimeZone(
        new Date(previousDate),
        businessProfile.timezone
      );
      const reset5daysStreaks = [null, null, null, null, null];
      const last5days = this.modifyLast5DaysStreaks(
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
      await BusinessProfileTable.findOneAndUpdate(
        { userId: id },
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
    const longestStreak = businessProfile?.streaks?.longestStreak || 0;
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
    businessProfile = { ...businessProfile, achievements, statistics };
    return businessProfile;
  }

  /**
   * @description This method is used to set streak goals
   * @param userId
   * @param streakGoalId
   * @returns {*}
   */
  public async setStreakGoals(userId: string, streakGoalsId: string) {
    try {
      const streakGoalsIfExists = await StreakGoalTable.findOne({
        _id: streakGoalsId,
      });
      if (!streakGoalsIfExists) {
        throw new NetworkError("No Streak Goal Found", 400);
      }
      await BusinessProfileTable.findOneAndUpdate(
        { userId: userId },
        {
          $set: {
            streakGoal: streakGoalsId,
          },
        }
      );
      return true;
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }

  /**
   * @description This method is used to add streaks
   * @param userId
   * @param quizResults
   * @returns {*}
   */
  public async addStreaks(userId: string, quizResults: any, timezone: string) {
    try {
      let showStreakScreen = false;
      const reset5daysStreak = [1, null, null, null, null];
      let streak = {};
      const currentDate = convertDateToTimeZone(new Date(), timezone);
      let businessProfile = await BusinessProfileTable.findOne({ userId });
      const previousStreak = businessProfile.streak.current;
      const isFirstStreak =
        !businessProfile || businessProfile?.streak?.updatedDate?.day === 0;
      const { year, month, day } = businessProfile.streak.updatedDate;
      const startDate = formattedDate(year, month, day);
      const endDate = new Date(currentDate.date);
      const difference = getDaysBetweenDates(startDate, endDate);
      if (isFirstStreak || (!isFirstStreak && difference === 1)) {
        let last5days: any = [];
        const earliestNullIndex =
          businessProfile?.streak?.last5days?.indexOf(null) ?? -1;
        if (earliestNullIndex === -1) {
          last5days = reset5daysStreak;
        } else {
          businessProfile.streak.last5days[earliestNullIndex] = 1;
          last5days = businessProfile.streak.last5days;
        }
        streak = {
          ...streak,
          current: businessProfile?.streak?.current + 1,
          longest:
            businessProfile?.streak?.longest <
            businessProfile?.streak?.current + 1
              ? businessProfile?.streak?.current + 1
              : businessProfile?.streak?.longest,
          updatedDate: {
            day: currentDate.day,
            month: currentDate.month,
            year: currentDate.year,
          },
          last5days,
        };
        showStreakScreen = true;
      } else if (difference > 1) {
        const last5days = this.modifyLast5DaysStreaks(
          difference,
          businessProfile.streak.last5days,
          reset5daysStreak
        );

        streak = {
          ...streak,
          current: 1,
          longest: businessProfile.streak.longest,
          updatedDate: {
            day: currentDate.day,
            month: currentDate.month,
            year: currentDate.year,
          },
          last5days,
        };
        showStreakScreen = true;
      }
      if (showStreakScreen) {
        businessProfile = await BusinessProfileTable.findOneAndUpdate(
          { userId: userId },
          {
            $set: {
              streak: streak,
            },
          },
          { upsert: true }
        );
        const dayRange = this.get5DaysOfWeek(
          businessProfile.streak.updatedDate,
          businessProfile.streak.last5days
        );
        return {
          showStreakScreen,
          last5DaysStreak: businessProfile.streak.last5days,
          last5DaysWeek: dayRange,
          currentStreak: businessProfile.streak.current,
          previousStreak: businessProfile.streak.current,
        };
      }

      /**
       * Give last5days streak and last5days of week
       */
      return {
        showStreakScreen,
      };
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }

  /**
   * @description This method is used to modify the last 5 days array based on certain conditions
   * @param difference
   * @param last5days
   * @param reset5daysStreak
   * @return {*}
   */
  public modifyLast5DaysStreaks(
    difference: number,
    last5days: any,
    reset5daysStreak: any,
    isStreakAdded: boolean = true
  ) {
    let dayStreaks: any = [];
    const nullCount = last5days.filter((item) => item === null).length;
    if (difference > nullCount) {
      dayStreaks = reset5daysStreak;
    } else {
      for (let i = 0; i < last5days.length; i++) {
        if (last5days[i] === null) {
          if (i <= difference - 1) {
            last5days[i] = 0;
          } else if (i === difference && isStreakAdded) {
            last5days[i] = 1;
          }
        }
      }
      dayStreaks = last5days;
    }
    return dayStreaks;
  }

  /**
   * @description This method is used to get5DaysOfWeek and give day range
   * @param date
   * @param last5days
   * @return {*}
   */
  public get5DaysOfWeek(date: any, last5days: any) {
    let dayRange = [];
    const notNullLast5DaysCount = last5days.filter((x) => x !== null).length;
    let updatedDate: any = formattedDate(date.year, date.month, date.day);
    notNullLast5DaysCount === 0
      ? updatedDate
      : updatedDate.setDate(updatedDate.getDate() - notNullLast5DaysCount + 1);
    const daysOfWeek = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    for (let i = 0; i < 5; i++) {
      const dayIndex = updatedDate.getDay();
      const dayName = daysOfWeek[dayIndex];
      dayRange.push(dayName.charAt(0));
      updatedDate.setDate(updatedDate.getDate() + 1);
    }
    return dayRange;
  }
}

export default new BusinessProfileService();
