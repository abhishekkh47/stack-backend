import { CommunityTable, UserCommunityTable } from "@app/model";
import {
  CHALLENGE_TYPE,
  LIST,
  RALLY_COMMUNITY_CHALLENGE_GOAL,
  COMMUNITY_LEVELS,
  HOUR_TO_MS,
} from "@app/utility";
import { CommunityDBService as CommunityDBServiceV6 } from "@app/services/v6";
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
   * @param community
   * @returns {*}
   */
  public async joinCommunity(userId: any, community: any) {
    let isVP = false;
    const numberOfCommunityMembers = await UserCommunityTable.count({
      communityId: community._id,
    });
    if (numberOfCommunityMembers < RALLY_COMMUNITY_CHALLENGE_GOAL) {
      isVP = true;
    }
    const addTime = 24 * HOUR_TO_MS;
    const response = await UserCommunityTable.create({
      userId: userId,
      communityId: community._id,
      isVP: isVP,
      subscriptionOfferExpiresIn: new Date(new Date().getTime() + addTime),
    });

    return response;
  }

  /**
   * @description This method is used to get community leaderboard
   * @param community
   * @returns {*}
   */
  public async getCommunityLeaderboard(
    community: any,
    query: any,
    userId: any
  ) {
    const now = new Date();
    const startOfWeek = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - (now.getDay() - 1),
      0,
      0,
      0
    );
    const endOfWeek = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + (7 - now.getDay()),
      23,
      59,
      59
    );
    const page = isNaN(parseInt(query?.page)) ? 1 : parseInt(query?.page);
    const offset = (page - 1) * LIST.limit;
    const aggregateQuery: any = [
      {
        $match: {
          communityId: community._id,
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
        $lookup: {
          from: "business-profiles",
          localField: "userId",
          foreignField: "userId",
          as: "profileData",
        },
      },
      {
        $unwind: {
          path: "$profileData",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $lookup: {
          from: "stages",
          localField: "userData.stage",
          foreignField: "_id",
          as: "stageData",
        },
      },
      {
        $unwind: {
          path: "$stageData",
          preserveNullAndEmptyArrays: true,
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
            totalXPPoints: {
              $sum: "$xpPoints",
            },
          },
        },
      },
      {
        $addFields: {
          isNewUser: {
            $cond: {
              if: {
                $and: [
                  {
                    $gte: ["$createdAt", startOfWeek],
                  },
                  {
                    $lte: ["$createdAt", endOfWeek],
                  },
                ],
              },
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $project: {
          _id: "$userData._id",
          xpPoints: 1,
          rank: 1,
          isNewUser: 1,
          firstName: "$userData.firstName",
          isVP: 1,
          lastName: "$userData.lastName",
          total: 1,
          totalXPPoints: 1,
          communityId: 1,
          profilePicture: "$userData.profilePicture",
          quizCoins: "$userData.quizCoins",
          preLoadedCoins: "$userData.preLoadedCoins",
          activeStreak: "$userData.streak.current",
          businessScore: "$userData.businessScore.current",
          companyName: "$profileData.companyName.title",
          companyLogo: "$profileData.companyLogo",
          "stage.name": "$stageData.title",
          "stage.colorInfo": "$stageData.leaderBoardColorInfo",
          subscriptionOfferExpiresIn: 1,
        },
      },
    ];
    let userQuery: any = [...aggregateQuery];
    userQuery.push({
      $match: {
        _id: userId,
      },
    });
    aggregateQuery.push(
      {
        $limit: page ? LIST.limit * page : LIST.limit,
      },
      { $skip: offset }
    );
    const [userDetails, leaderBoardData] = await Promise.all([
      UserCommunityTable.aggregate(userQuery).exec(),
      UserCommunityTable.aggregate(aggregateQuery).exec(),
    ]);
    CommunityDBServiceV6.processStageData(leaderBoardData);
    CommunityDBServiceV6.processStageData(userDetails);

    /**
     * Weekly challenge Date Logic
     */
    let weeklyChallengeDate = null;

    const totalRecords =
      leaderBoardData.length > 0 ? leaderBoardData[0].total : 0;
    const { currentLevel, nextLevel } = this.findCommunityLevel(totalRecords);

    const subscriptionOfferExpiresIn = new Date(
      userDetails[0]?.subscriptionOfferExpiresIn as any
    );
    const remainingTime =
      subscriptionOfferExpiresIn.valueOf() - new Date().valueOf();
    return {
      leaderBoardData,
      userObject: userDetails.length > 0 ? userDetails[0] : null,
      totalRecords,
      totalXPPoints:
        leaderBoardData.length > 0 ? leaderBoardData[0].totalXPPoints : 0,
      weeklyChallengeDate,
      communityLevel: {
        current: currentLevel,
        next: nextLevel,
      },
      subscriptionOfferExpiresIn:
        remainingTime > 0 ? subscriptionOfferExpiresIn : null,
    };
  }

  private findCommunityLevel(x) {
    const index = COMMUNITY_LEVELS.findIndex(
      (level) => level.min_members <= x && x <= level.max_members
    );
    const currentLevel = index !== -1 ? COMMUNITY_LEVELS[index] : null;
    const nextLevel =
      index !== -1 && index + 1 < COMMUNITY_LEVELS.length
        ? COMMUNITY_LEVELS[index + 1]
        : null;

    return { currentLevel, nextLevel };
  }
}
export default new CommunityDBService();
