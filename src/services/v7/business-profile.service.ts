import {
  BusinessProfileTable,
  ImpactTable,
  PassionTable,
  WeeklyJourneyResultTable,
} from "@app/model";
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

      if (data.weeklyJourneyId) {
        const dataToCreate = {
          weeklyJourneyId: data.weeklyJourneyId,
          actionNum: data.actionNum,
          userId: userId,
          actionInput: data.key,
        };
        await WeeklyJourneyResultTable.create(dataToCreate);
      }
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
        $addFields: {
          allBusinessPlans: [
            {
              key: "description",
              type: "text",
              value: "$description",
              sectionTitle: "Business Description",
              sheetTitle: "Add your business decription",
            },
            {
              key: "businessLogo",
              type: "image",
              value: "$businessLogo",
              sectionTitle: "Busines Logo",
              sheetTitle: "Upload your business logo",
            },
            {
              key: "businessName",
              type: "text",
              value: "$businessName",
              sectionTitle: "Business Name",
              sheetTitle: "Add your business name",
            },
            {
              key: "competitors",
              type: "text",
              value: "$competitors",
              sectionTitle: "Core Competitors",
              sheetTitle: "Add your core competitors",
            },
            {
              key: "keyDifferentiators",
              type: "text",
              value: "$keyDifferentiators",
              sectionTitle: "Key Differentiators",
              sheetTitle: "Add your key differentiators",
            },
            {
              key: "targetAudience",
              type: "text",
              value: "$targetAudience",
              sectionTitle: "Target Audience",
              sheetTitle: "Add your target audience",
            },
          ],
        },
      },
      {
        $addFields: {
          filteredBusinessPlans: {
            $filter: {
              input: "$allBusinessPlans",
              as: "plan",
              cond: {
                $and: [
                  { $ne: ["$$plan.value", undefined] },
                  { $ne: ["$$plan.value", null] },
                  { $ne: [{ $type: "$$plan.value" }, "missing"] },
                ],
              },
            },
          },
        },
      },
      {
        $project: {
          _id: "$_id",
          userId: "$userId",
          impacts: 1,
          passions: 1,
          businessPlans: "$filteredBusinessPlans",
        },
      },
    ]).exec();
    return businessProfile?.[0] ?? null;
  }
}
export default new BusinessProfileService();
