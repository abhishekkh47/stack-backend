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
      const { id, needHelpID } = queryParams;
      const { options: needHelpIn } = COACH_REQUIREMENTS.needHelpIn;
      const message = needHelpIn.find(
        (option) => option.id == Number(needHelpID)
      ).message;
      let initialMessage = null;
      let mentorIndex = Math.floor(Math.random() * MENTORS.length);
      if (Number(id) == 1 || Number(id) == 4) {
        mentorIndex = 1;
      } else if (Number(id) == 2 || Number(id) == 3) {
        mentorIndex = 0;
      }
      const key = MENTORS[mentorIndex];
      const coachProfile = await CoachProfileTable.findOne({ key });
      if (coachProfile) {
        initialMessage = `Hey ${userIfExists.firstName}! I'm ${
          coachProfile.name.split(" ")[0]
        }, your startup coach. ${message}`;
        await BusinessProfileTable.findOneAndUpdate(
          { userId: userIfExists._id },
          {
            $set: {
              "businessCoachInfo.coachId": coachProfile._id,
              "businessCoachInfo.initialMessage": initialMessage,
            },
          },
          { upsert: true }
        );
      }
      return { coachProfile, initialMessage };
    } catch (err) {
      throw new NetworkError(
        "Error occurred while retrieving coach profile",
        400
      );
    }
  }
}
export default new CoachDBService();
