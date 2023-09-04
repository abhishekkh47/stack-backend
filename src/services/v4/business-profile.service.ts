import {
  BusinessProfileTable,
  ImpactTable,
  PassionTable,
  StreakGoalTable,
} from "@app/model";
import { NetworkError } from "@app/middleware";
import { ObjectId } from "mongodb";

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
    const businessProfile = await BusinessProfileTable.aggregate([
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
        },
      },
    ]).exec();
    return businessProfile?.[0] ?? null;
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
