import { CommunityTable, UserCommunityTable } from "@app/model";
import {
  CHALLENGE_XP_INITIAL_GOAL,
  COMMUNITY_CHALLENGE_CLAIM_STATUS,
  CHALLENGE_TYPE,
  LIST,
} from "@app/utility/constants";
class CommunityDBService {
  /**
   * @description create new community
   * @param requestBody
   * @param user
   * @returns {*}
   */
  public async createCommunity(requestBody: any, user: any) {
    const { name, googlePlaceId } = requestBody;
    const response = await CommunityTable.create({
      name,
      googlePlaceId,
      createdBy: user._id,
      challenge: {
        type: CHALLENGE_TYPE[0],
        xpGoal: 0,
        endAt: null,
        reward: 0,
      },
    });
    if (response) {
      await this.joinCommunity(user._id, response);
    }
    return response;
  }

  /**
   * @description This method is used to join users in a specific community
   * @param userId
   * @param communityId
   * @returns {*}
   */
  public async joinCommunity(userId: any, community: any) {
    let isVP = false;
    let isClaimed = COMMUNITY_CHALLENGE_CLAIM_STATUS.NOT_STARTED;
    const numberOfCommunityMembers = await UserCommunityTable.count({
      communityId: community._id,
    });
    if (numberOfCommunityMembers <= 5) {
      isVP = true;
    }
    /**
     * Challenge finishes
     * Send SQS message here
     */
    if (
      community.challenge.type === CHALLENGE_TYPE[0] &&
      numberOfCommunityMembers === 5
    ) {
      isClaimed = COMMUNITY_CHALLENGE_CLAIM_STATUS.PENDING;
      /**
       * TODO FOR SQS MESSAGE
       */
    }
    const response = await UserCommunityTable.create({
      userId: userId,
      communityId: community._id,
      isVP: isVP,
      isClaimed,
    });
    return response;
  }

  /**
   * @description This method is used to get community leaderboard
   * @param communityId
   * @returns {*}
   */
  public async getCommunityLeaderboard(
    communityId: any,
    query: any,
    userId: any
  ) {
    const offset = (parseInt(query.page) - 1) * LIST.limit;
    const aggregateQuery: any = [
      {
        $match: {
          communityId,
        },
      },
      {
        $setWindowFields: {
          sortBy: {
            xpPoints: -1,
          },
          output: {
            rank: {
              $documentNumber: {},
            },
            total: {
              $count: {},
            },
          },
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
        $limit: query?.page ? LIST.limit * parseInt(query?.page) : 20,
      },
      { $skip: offset },
      {
        $project: {
          _id: "$userData._id",
          xpPoints: 1,
          rank: 1,
          firstName: "$userData.firstName",
          isVP: 1,
          lastName: "$userData.lastName",
          total: 1,
          profilePicture: "$userData.profilePicture",
          quizCoins: "$userData.quizCoins",
          preLoadedCoins: "$userData.preLoadedCoins",
          activeStreak: "$userData.streak.current",
        },
      },
    ];
    const userDetails = await UserCommunityTable.aggregate([
      {
        $match: {
          communityId,
        },
      },
      {
        $setWindowFields: {
          sortBy: {
            xpPoints: -1,
          },
          output: {
            rank: {
              $documentNumber: {},
            },
            total: {
              $count: {},
            },
          },
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
        $project: {
          _id: "$userData._id",
          xpPoints: 1,
          rank: 1,
          firstName: "$userData.firstName",
          isVP: 1,
          lastName: "$userData.lastName",
          total: 1,
          profilePicture: "$userData.profilePicture",
          quizCoins: "$userData.quizCoins",
          preLoadedCoins: "$userData.preLoadedCoins",
          activeStreak: "$userData.streak.current",
        },
      },
      {
        $match: {
          _id: userId,
        },
      },
    ]).exec();
    const leaderBoardData = await UserCommunityTable.aggregate(
      aggregateQuery
    ).exec();

    return {
      leaderBoardData,
      userObject: userDetails.length > 0 ? userDetails[0] : null,
      totalRecords: leaderBoardData.length > 0 ? leaderBoardData[0].total : 0,
    };
  }
}
export default new CommunityDBService();
