import {
  BusinessProfileTable,
  ImpactTable,
  PassionTable,
  StreakGoalTable,
  UserStreakTable,
} from "@app/model";
import { NetworkError } from "@app/middleware";
import { ObjectId } from "mongodb";
import moment from "moment";
import { LEVELS } from "@app/utility";

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
          streaks: {
            $first: "$streaks",
          },
        },
      },
    ]).exec();
    if (businessProfile.length === 0) return null;
    businessProfile = businessProfile[0];
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
    businessProfile = { ...businessProfile, achievements };
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
  public async addStreaks(userId: string, quizResults: any) {
    try {
      let isUserStreakCreated = false;
      let streaks = {};
      const quizResultsDate = moment(quizResults.createdAt).startOf("day");
      const businessProfile = await BusinessProfileTable.findOne({ userId });
      let updatedStreakDate = null;
      if (businessProfile?.streaks?.updatedStreakDate) {
        updatedStreakDate = moment(businessProfile.streaks.updatedStreakDate);
        const differenceBetweenDate = quizResultsDate.diff(
          updatedStreakDate,
          "days"
        );
        if (differenceBetweenDate === 1) {
          streaks = {
            currentStreak: businessProfile.streaks.currentStreak + 1,
            longestStreak:
              businessProfile.streaks.longestStreak <=
              businessProfile.streaks.currentStreak + 1
                ? businessProfile.streaks.currentStreak + 1
                : businessProfile.streaks.longestStreak,
            updatedStreakDate: moment(quizResultsDate).format("YYYY-MM-DD"),
          };
          isUserStreakCreated = true;
        } else if (differenceBetweenDate !== 0 && differenceBetweenDate > 1) {
          streaks = {
            currentStreak: 1,
            longestStreak: businessProfile.streaks.longestStreak,
            updatedStreakDate: moment(quizResultsDate).format("YYYY-MM-DD"),
          };
        }
      } else {
        streaks = {
          ...streaks,
          currentStreak: 1,
          longestStreak: 1,
          updatedStreakDate: moment(quizResultsDate).format("YYYY-MM-DD"),
        };
        isUserStreakCreated = true;
      }
      if (isUserStreakCreated) {
        await UserStreakTable.create({
          userId: userId,
          streakDate: moment(quizResultsDate).format("YYYY-MM-DD"),
        });
      }
      return true;
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }
}

export default new BusinessProfileService();
