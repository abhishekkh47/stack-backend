import { NetworkError } from "@app/middleware";
import { BusinessProfileTable, CoachProfileTable } from "@app/model";
import { COACH_REQUIREMENTS, MENTORS } from "@app/utility";
class CoachDBService {
  /**
   * @description get coach based on user requirement
   * @param userIfExists
   * @param queryParams
   * @returns {*}
   */
  public async getCoachProfile(userIfExists: any, queryParams: any) {
    try {
      const id = queryParams.requirementID;
      const options = COACH_REQUIREMENTS.goodAt.options;
      let key = null;
      if (id == options[0].id || id == options[3].id) {
        key = MENTORS[1];
      } else if (id == options[1].id || id == options[2].id) {
        key = MENTORS[0];
      } else {
        key = MENTORS[Math.floor(Math.random() * MENTORS.length)];
      }
      const coachDetails = await CoachProfileTable.findOne({ key });
      if (coachDetails) {
        await BusinessProfileTable.findOneAndUpdate(
          { userId: userIfExists._id },
          { $set: { coachId: coachDetails._id } },
          { upsert: true }
        );
      }
      return coachDetails;
    } catch (err) {
      throw new NetworkError(
        "Error occurred while retrieving coach profile",
        400
      );
    }
  }
}
export default new CoachDBService();
