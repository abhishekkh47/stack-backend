import { BusinessProfileTable, ImpactTable, PassionTable } from "@app/model";
import { NetworkError } from "@app/middleware";
import { ObjectId } from "mongodb";

class BusinessProfileService {
  /**
   * @description add or update business profile
   * @param data
   * @param userProgress
   * @returns {*}
   */
  public async addOrEditBusinessProfile(data: any, userId: string) {
    try {
      let obj = {};
      obj[data.key] = data.value;
      await BusinessProfileTable.findOneAndUpdate(
        {
          userId: userId,
        },
        {
          $set: obj,
        },
        { upsert: true }
      );
      return true;
    } catch (error) {
      throw new NetworkError("Something went wrong", 400);
    }
  }

  /**
   * @description get business profile
   */
  public async getBusinessProfile(id: string) {
    let businessProfile: any = await BusinessProfileTable.aggregate([
      {
        $match: {
          userId: new ObjectId(id),
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
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $project: {
          _id: "$_id",
          userId: "$userId",
          businessPlans: [
            {
              key: "description",
              type: "text",
              value: "$description",
            },
            {
              key: "businessLogo",
              type: "image",
              value: "$businessLogo",
            },
            {
              key: "businessName",
              type: "text",
              value: "$businessName",
            },
            {
              key: "competitors",
              type: "text",
              value: "$competitors",
            },
            {
              key: "keyDifferentiators",
              type: "text",
              value: "$keyDifferentiators",
            },
            {
              key: "targetAudience",
              type: "text",
              value: "$targetAudience",
            },
          ],
        },
      },
    ]).exec();
    return businessProfile?.[0] ?? null;
  }
}
export default new BusinessProfileService();
