import { NetworkError } from "@app/middleware";
import { WeeklyJourneyTable, WeeklyJourneyResultsTable } from "@app/model";
import {} from "@app/utility/constants";
class WeeklyJourneyDBService {
  /**
   * @description create new community
   * @param userProgress
   * @returns {*}
   */
  public async getUserNextChallenge(userProgress: any) {
    try {
      let userJourney = await WeeklyJourneyResultsTable.aggregate([
        {
          $match: {
            userId: userProgress.userId,
          },
        },
        {
          $lookup: {
            from: "weekly_journey",
            localField: "weeklyJourneyId",
            foreignField: "_id",
            as: "weekly_journey",
          },
        },
        {
          $unwind: {
            path: "$weekly_journey",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            userId: 1,
            actionNum: 1,
            nextChallenge: "$weekly_journey",
          },
        },
      ]).exec();
      return userJourney;
    } catch (err) {
      console.log("ERROR : ", err);
    }
  }
}
export default new WeeklyJourneyDBService();