import { NetworkError } from "@app/middleware";
import { CommunityTable, UserCommunityTable, UserTable } from "@app/model";
import {
  CHALLENGE_TYPE,
  LIST,
  RALLY_COMMUNITY_CHALLENGE_GOAL,
  COMMUNITY_CHALLENGE_CLAIM_STATUS,
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
    const numberOfCommunityMembers = await UserCommunityTable.count({
      communityId: community._id,
    });
    if (numberOfCommunityMembers < RALLY_COMMUNITY_CHALLENGE_GOAL) {
      isVP = true;
    }
    /**
     * Challenge finishes
     * Send SQS message here
     */
    if (
      community.challenge.type === CHALLENGE_TYPE[0] &&
      numberOfCommunityMembers === RALLY_COMMUNITY_CHALLENGE_GOAL
    ) {
      /**
       * TODO FOR SQS MESSAGE
       */
    }
    const response = await UserCommunityTable.create({
      userId: userId,
      communityId: community._id,
      isVP: isVP,
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
    const offset = (parseInt(query.page) - 1) * LIST.limit;
    const aggregateQuery: any = [
      {
        $match: {
          communityId,
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
        },
      },
    ];
    let userQuery = JSON.parse(JSON.stringify(aggregateQuery));
    userQuery = userQuery.slice(1);
    userQuery.push({
      $match: {
        _id: userId,
        communityId: communityId,
      },
    });
    aggregateQuery.push(
      {
        $limit: query?.page ? LIST.limit * parseInt(query?.page) : 20,
      },
      { $skip: offset }
    );
    const userDetails = await UserCommunityTable.aggregate(userQuery).exec();
    const leaderBoardData = await UserCommunityTable.aggregate(
      aggregateQuery
    ).exec();

    /**
     * Weekly challenge Date Logic
     */
    const todayDate = new Date();
    let weeklyChallengeDate = null;
    if (leaderBoardData[0].total >= RALLY_COMMUNITY_CHALLENGE_GOAL) {
      let daysUntilNextMonday = 1 - todayDate.getDay();
      if (daysUntilNextMonday <= 0) {
        daysUntilNextMonday += 7;
      }
      const nextMonday = new Date(todayDate);
      nextMonday.setHours(0, 0, 0, 0);
      nextMonday.setDate(todayDate.getDate() + daysUntilNextMonday);
      weeklyChallengeDate = nextMonday;
    }

    return {
      leaderBoardData,
      userObject: userDetails.length > 0 ? userDetails[0] : null,
      totalRecords: leaderBoardData.length > 0 ? leaderBoardData[0].total : 0,
      totalXPPoints:
        leaderBoardData.length > 0 ? leaderBoardData[0].totalXPPoints : 0,
      weeklyChallengeDate,
    };
  }

  /**
   * @description This method is used to return boolean for community goal achieved or not
   * @param communityDetails
   */
  public async checkCommunityGoalAchievedOrNot(communityDetails: any) {
    let isGoalAchieved = false;
    const userCommunityDetails: any = await UserCommunityTable.aggregate([
      {
        $match: {
          communityId: communityDetails._id,
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
    ]).exec();
    if (userCommunityDetails.length === 0) return isGoalAchieved;
    if (communityDetails.challenge.type === CHALLENGE_TYPE[0]) {
      if (userCommunityDetails[0].total >= RALLY_COMMUNITY_CHALLENGE_GOAL) {
        isGoalAchieved = true;
      }
    } else {
      if (
        communityDetails.challenge.xpGoal <=
        userCommunityDetails[0].totalXPPoints
      ) {
        isGoalAchieved = true;
      }
    }
    return isGoalAchieved;
  }

  /**
   * @description This method is used to return claim reward based on community challenges
   * @param userDetails
   * @param userCommunityDetails
   */
  public async claimReward(userDetails: any, userCommunityDetails: any) {
    try {
      if (
        userCommunityDetails.isClaimed ===
        COMMUNITY_CHALLENGE_CLAIM_STATUS.CLAIMED
      ) {
        throw new NetworkError("You already had claimed reward", 400);
      }
      const totalMembersInCommunity = await this.getTotalMembersInCommunity(
        userCommunityDetails.communityId
      );
      if (
        totalMembersInCommunity.length === 0 ||
        totalMembersInCommunity.length < RALLY_COMMUNITY_CHALLENGE_GOAL
      ) {
        throw new NetworkError("You are not eligible", 400);
      }
      if (totalMembersInCommunity[0].challengeType === CHALLENGE_TYPE[0]) {
        throw new NetworkError(
          "You need to be in weekly challenge in order to get reward",
          400
        );
      }
      const { reward } = totalMembersInCommunity[0].community.challenge;
      if (totalMembersInCommunity[0].totalXPPoints < reward) {
        throw new NetworkError("Your goal is not achieved yet.", 400);
      }
      /**
       * Time to gift reward
       */
      const updatedUser = await UserTable.findOneAndUpdate(
        { _id: userDetails._id },
        {
          $inc: {
            preLoadedCoins: reward,
          },
        },
        {
          new: true,
        }
      );
      await UserCommunityTable.updateOne(
        { userId: userDetails._id },
        {
          $set: {
            isClaimed: COMMUNITY_CHALLENGE_CLAIM_STATUS.CLAIMED,
          },
        }
      );
      return updatedUser;
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }

  /**
   * @description This method is used to get total members in community
   * @param communityId
   * @returns {boolean}
   */
  public async getTotalMembersInCommunity(communityId: any) {
    try {
      let userCommunities: any = await UserCommunityTable.aggregate([
        {
          $match: {
            communityId: communityId,
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
              totalXPPoints: {
                $sum: "$xpPoints",
              },
            },
          },
        },
        {
          $lookup: {
            from: "communities",
            localField: "communityId",
            foreignField: "_id",
            as: "community",
          },
        },
        {
          $unwind: {
            path: "$community",
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "userDetails",
          },
        },
        {
          $unwind: {
            path: "$userDetails",
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $project: {
            _id: 1,
            userDetails: "$userDetails",
            isClaimed: 1,
            community: "$community",
            totalXPPoints: 1,
            challengeType: "$community.challenge.type",
          },
        },
      ]).exec();
      return userCommunities;
    } catch (error) {
      throw new NetworkError("Something went wrong", 400);
    }
  }

  /**
   * @description This method is used to get total members in community
   * @param communityId
   * @returns {boolean}
   */
  public async updateCommunityToLatestChallenge(communityDetails: any) {
    try {
      const totalMembersInCommunity: any = this.getTotalMembersInCommunity(
        communityDetails._id
      );
      if (totalMembersInCommunity.length < RALLY_COMMUNITY_CHALLENGE_GOAL) {
        if (
          (communityDetails.challenge.type === CHALLENGE_TYPE[0] &&
            communityDetails.challenge.endAt) ||
          communityDetails.challenge.type === CHALLENGE_TYPE[1]
        ) {
          communityDetails = await CommunityTable.findOneAndUpdate(
            {
              _id: communityDetails._id,
            },
            {
              $set: {
                challenge: {
                  type: CHALLENGE_TYPE[0],
                  xpGoal: 0,
                  endAt: null,
                  reward: 0,
                },
              },
            },
            { new: true }
          );
        }
      }
      return communityDetails;
    } catch (error) {
      throw new NetworkError("Something went wrong", 400);
    }
  }
}
export default new CommunityDBService();
