import { CommunityTable, UserCommunityTable } from "@app/model";
import { CHALLENGE_XP_INITIAL_GOAL } from "@app/utility/constants";
class CommunityDBService {
  /**
   * @description create new community
   * @param reqParams
   */
  public async createCommunity(body: any) {
    const { name, googlePlaceId, createdBy } = body;
    const response = await CommunityTable.create({
      name,
      googlePlaceId,
      createdBy,
      challenge: {
        type: "rally_community",
        xpGoal: CHALLENGE_XP_INITIAL_GOAL,
        endAt: null,
        reward: 0,
      },
    });
    if (response) {
      // await UserCommunityTable.create({ userId: reqParam.createdBy, communityId: response._id, isVP: true })
      await this.joinCommunity(body.createdBy, response._id);
    }
    return response;
  }
  public async joinCommunity(userId: any, communityId: any) {
    // const reqParam = body;
    let isVP = false;
    const numberOfCommunityMembers = await UserCommunityTable.find({
      communityId: communityId,
    }).count();
    if (numberOfCommunityMembers < 5) {
      isVP = true;
    }
    const response = await UserCommunityTable.create({
      userId: userId,
      communityId: communityId,
      isVP: isVP,
    });
    return response;
  }
}
export default new CommunityDBService();
