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
  public async getCoachRequirements(userIfExists: any, queryParams: any) {
    try {
      const requirement = queryParams.requirement;
      const options = COACH_REQUIREMENTS.goodAt.options;
      let key = null;
      if (requirement == options[0] || requirement == options[3]) {
        key = MENTORS[1];
      } else if (requirement == options[1] || requirement == options[2]) {
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
      throw new NetworkError("Error occured while claiming the reward", 400);
    }
  }
}
export default new CoachDBService();
