import { BusinessProfileTable, ImpactTable, PassionTable } from "@app/model";
import { NetworkError } from "@app/middleware";
import { ObjectId } from "mongodb";
import { STREAK_LEVELS } from "@app/utility";

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
    /**
     * Achievements
     */
    let achievements = {};
    const longestStreak = businessProfile?.streak?.longest || 0;
    if (longestStreak >= STREAK_LEVELS.LEVEL6.maxValue) {
      const additionalLevels =
        Math.floor((longestStreak - STREAK_LEVELS.LEVEL6.maxValue) / 50) + 1;
      const level = 7 + additionalLevels;
      const maxValue = STREAK_LEVELS.LEVEL6.maxValue + additionalLevels * 50;

      achievements = {
        level,
        longestStreak,
        maxValue,
      };
    } else {
      switch (true) {
        case longestStreak < STREAK_LEVELS.LEVEL1.maxValue:
          achievements = {
            level: STREAK_LEVELS.LEVEL1.level,
            longestStreak,
            maxValue: STREAK_LEVELS.LEVEL1.maxValue,
          };
          break;
        case longestStreak < STREAK_LEVELS.LEVEL2.maxValue:
          achievements = {
            level: STREAK_LEVELS.LEVEL2.level,
            longestStreak,
            maxValue: STREAK_LEVELS.LEVEL2.maxValue,
          };
          break;
        case longestStreak < STREAK_LEVELS.LEVEL3.maxValue:
          achievements = {
            level: STREAK_LEVELS.LEVEL3.level,
            longestStreak,
            maxValue: STREAK_LEVELS.LEVEL3.maxValue,
          };
          break;
        case longestStreak < STREAK_LEVELS.LEVEL4.maxValue:
          achievements = {
            level: STREAK_LEVELS.LEVEL4.level,
            longestStreak,
            maxValue: STREAK_LEVELS.LEVEL4.maxValue,
          };
          break;
        case longestStreak < STREAK_LEVELS.LEVEL5.maxValue:
          achievements = {
            level: STREAK_LEVELS.LEVEL5.level,
            longestStreak,
            maxValue: STREAK_LEVELS.LEVEL5.maxValue,
          };
          break;
        case longestStreak < STREAK_LEVELS.LEVEL6.maxValue:
          achievements = {
            level: STREAK_LEVELS.LEVEL6.level,
            longestStreak,
            maxValue: STREAK_LEVELS.LEVEL6.maxValue,
          };
          break;
      }
    }
    businessProfile = { ...businessProfile, achievements };
    return businessProfile;
  }
}

export default new BusinessProfileService();
