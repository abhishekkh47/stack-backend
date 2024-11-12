import { NetworkError } from "@app/middleware/error.middleware";
import {
  DripshopTable,
  UserCommunityTable,
  UserTable,
  DripshopItemTable,
  BusinessProfileTable,
  StageTable,
} from "@app/model";
import { ObjectId } from "mongodb";
import {
  convertDateToTimeZone,
  getDaysBetweenDates,
  ALL_NULL_5_DAYS,
  DEFAULT_TIMEZONE,
  DEFAULT_LIFE_COUNT,
  MAX_STREAK_FREEZE,
  STREAK_FREEZE_FUEL,
  COMMUNITY_CHALLENGE_CLAIM_STATUS,
  RALLY_COMMUNITY_REWARD,
  getDaysNum,
  STAGE_COMPLETE,
} from "@app/utility";
import { UserDBService as UserDBServiceV4, AnalyticsService } from "../v4";
import { QuizDBService, CommunityDBService } from "../v6";
import { UserService } from "../v9";

class UserDBService {
  /**
   * @description Get Profile of users
   * @param userId
   */
  public async getProfile(userId: string) {
    let data = (
      await UserTable.aggregate([
        { $match: { _id: new ObjectId(userId) } },
        {
          $lookup: {
            from: "business-profiles",
            localField: "_id",
            foreignField: "userId",
            as: "businessProfile",
          },
        },
        {
          $unwind: {
            path: "$businessProfile",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "streak_goals",
            localField: "streakGoal",
            foreignField: "_id",
            as: "streakGoal",
          },
        },
        {
          $unwind: {
            path: "$streakGoal",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "user-refferals",
            localField: "_id",
            foreignField: "userId",
            as: "lifeTimeReferral",
          },
        },
        {
          $unwind: {
            path: "$lifeTimeReferral",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "user_communities",
            localField: "_id",
            foreignField: "userId",
            as: "userCommunity",
          },
        },
        {
          $unwind: {
            path: "$userCommunity",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "communities",
            localField: "userCommunity.communityId",
            foreignField: "_id",
            as: "communityDetails",
          },
        },
        {
          $unwind: {
            path: "$communityDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "stages",
            localField: "stage",
            foreignField: "_id",
            as: "stageDetails",
          },
        },
        {
          $unwind: {
            path: "$stageDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            email: 1,
            mobile: 1,
            firstName: 1,
            lastName: 1,
            type: 1,
            parentMobile: 1,
            parentEmail: 1,
            lifeTimeReferralCount: {
              $ifNull: ["$lifeTimeReferral.referralCount", 0],
            },
            referralCode: 1,
            streakGoal: {
              _id: "$streakGoal._id",
              day: "$streakGoal.day",
            },
            isOnboardingQuizCompleted: 1,
            dob: 1,
            profilePicture: 1,
            isNotificationOn: 1,
            isPhoneVerified: 1,
            quizCoins: 1,
            preLoadedCoins: 1,
            xpPoints: 1,
            timezone: 1,
            streak: 1,
            referralSource: 1,
            lifeCount: 1,
            renewLifeAt: 1,
            last5DaysStreak: "$streak.last5days",
            communityDetails: 1,
            isClaimed: "$userCommunity.isClaimed",
            isPremiumUser: 1,
            focusAreaTopic: 1,
            milestoneId:
              "$businessProfile.currentMilestone.milestoneId" || null,
            businessScore: 1,
            description: "$businessProfile.description",
            stage: 1,
            cash: 1,
            stageName: "$stageDetails.title",
          },
        },
      ]).exec()
    )[0];
    if (!data) {
      throw Error("Invalid user ID entered.");
    }
    if (
      data?.businessScore &&
      data?.businessScore.current > 0 &&
      (!data?.businessScore?.operationsScore ||
        data?.businessScore?.operationsScore == 0)
    ) {
      data = await this.updateBusinessSubScores(userId, data);
    }
    data = await this.getStageColorInfo(data);
    const currentDate = convertDateToTimeZone(
      new Date(),
      data?.timezone || DEFAULT_TIMEZONE
    );
    const businessScoreDiffDays = getDaysBetweenDates(
      data?.businessScore?.updatedDate || currentDate,
      currentDate
    );
    if (
      (data.description && businessScoreDiffDays >= 1) ||
      !data?.businessScore
    ) {
      const updatedInfo = await UserService.addBusinessScore(data);
      data = { ...data, businessScoreInfo: updatedInfo };
    }
    if (data.streak) {
      const { freezeCount } = data.streak;
      const { day } = data.streak?.updatedDate;
      const isFirstStreak = day === 0;
      const diffDays = getDaysBetweenDates(
        data.streak?.updatedDate,
        currentDate
      );
      let streakFreezeToConsume =
        freezeCount === 0 ? 0 : diffDays > MAX_STREAK_FREEZE ? freezeCount : 1;
      if (!(isFirstStreak || diffDays <= 1)) {
        const endDate = new Date(currentDate.date);
        let previousDate: any = new Date(
          endDate.setDate(endDate.getDate() - 1)
        );
        previousDate = {
          day: previousDate.getDate(),
          month: previousDate.getMonth() + 1,
          year: previousDate.getFullYear(),
        };
        const { last5days, isStreakInactive5Days } =
          UserDBServiceV4.modifyLast5DaysStreaks(
            diffDays,
            data?.streak?.last5days || [],
            ALL_NULL_5_DAYS,
            false,
            streakFreezeToConsume
          );
        const streak = {
          current:
            diffDays - streakFreezeToConsume <= 1 ? data.streak.current : 0,
          longest: data.streak.longest,
          updatedDate: previousDate,
          isStreakInactive5Days,
          last5days,
          freezeCount: freezeCount - streakFreezeToConsume,
        };
        let updateStreakQuery: any = {
          streak,
        };
        if (isStreakInactive5Days) {
          updateStreakQuery = {
            ...updateStreakQuery,
            streakGoal: null,
          };
        }
        const updatedStreak: any = await UserTable.findOneAndUpdate(
          { _id: data._id },
          {
            $set: updateStreakQuery,
          },
          { upsert: true, new: true }
        );
        data = { ...data, streak: updatedStreak.streak };
        AnalyticsService.identifyStreak(userId, streak);
      }
      const achievements = UserDBServiceV4.getUserStreaksAchievements(
        data.streak.longest
      );
      const dayRange = UserDBServiceV4.get5DaysOfWeek(
        data.streak.updatedDate.day !== 0
          ? data.streak.updatedDate
          : currentDate,
        data.streak.last5days
      );
      data = { ...data, achievements, last5DaysWeek: dayRange };
    }
    if (data.lifeCount !== DEFAULT_LIFE_COUNT) {
      const updatedData = await UserDBServiceV4.getUsersLatestLifeData(data);
      if (updatedData) {
        data = {
          ...data,
          ...updatedData,
        };
      }
    }
    const rallyCommunityReward = await DripshopItemTable.findOne({
      name: RALLY_COMMUNITY_REWARD,
    });
    let isQuizPlayedToday = await QuizDBService.checkQuizPlayedToday(data._id);
    data = { ...data, isQuizPlayedToday, rallyCommunityReward };

    /**
     * If user exists in community
     */
    if (data.communityDetails) {
      let isGoalAchieved =
        await CommunityDBService.checkCommunityGoalAchievedOrNot(
          data.communityDetails
        );
      data = { ...data, isGoalAchieved };
    }

    return { data };
  }
  /**
   * @description This method is used to refill all streakFreeze in exchange of fuel.
   * @param user
   * @returns {*}
   */
  public async refillStreakFreezeWithFuel(user: any) {
    const {
      streak: { freezeCount },
    } = user;
    if (freezeCount >= MAX_STREAK_FREEZE) {
      throw new NetworkError(
        `You already have ${MAX_STREAK_FREEZE} streak freeze`,
        400
      );
    }
    const fuelToBeDeducted =
      freezeCount === 0
        ? STREAK_FREEZE_FUEL
        : STREAK_FREEZE_FUEL / MAX_STREAK_FREEZE;
    const totalFuels = user.quizCoins + user.preLoadedCoins;
    if (totalFuels < fuelToBeDeducted) {
      throw new NetworkError(
        "You dont have sufficient fuels to refill streak freeze",
        400
      );
    }
    let updateQuery: any = { "streak.freezeCount": MAX_STREAK_FREEZE };
    if (totalFuels >= fuelToBeDeducted) {
      /**
       * once true check what to update preloaded or quiz coins or both
       */
      if (user.preLoadedCoins >= fuelToBeDeducted) {
        updateQuery = {
          ...updateQuery,
          preLoadedCoins: user.preLoadedCoins - fuelToBeDeducted,
        };
      } else {
        const amountLeftAfterPreloaded = fuelToBeDeducted - user.preLoadedCoins;

        if (amountLeftAfterPreloaded <= user.quizCoins) {
          updateQuery = {
            ...updateQuery,
            preLoadedCoins: 0,
            quizCoins: user.quizCoins - amountLeftAfterPreloaded,
          };
        }
      }
    }
    await UserTable.findOneAndUpdate(
      {
        _id: user._id,
      },
      {
        $set: updateQuery,
      }
    );
    return true;
  }

  /**
   * @description This service is used to update the fuels of user
   * @param userExists
   * @param dripshopData
   * @param fuel
   */
  public async redeemDripShop(
    userExists: any,
    dripshopData: any,
    body: any,
    isClaimed: boolean
  ) {
    const { fuel } = dripshopData;
    let totalChildFuels = userExists.preLoadedCoins + userExists.quizCoins;

    let updatedCoinQuery: any = {};

    if (!isClaimed) {
      if (totalChildFuels >= fuel) {
        /**
         * once true check what to update preloaded or quiz coins or both
         */
        if (userExists.preLoadedCoins >= fuel) {
          updatedCoinQuery = {
            ...updatedCoinQuery,
            $set: {
              preLoadedCoins: userExists.preLoadedCoins - fuel,
            },
          };
        } else {
          /**
           * amountLeftAfterPreloaded - contains amount left after removal of preloaded coins from required fuels
           */
          let amountLeftAfterPreloaded = fuel - userExists.preLoadedCoins;

          if (amountLeftAfterPreloaded <= userExists.quizCoins) {
            updatedCoinQuery = {
              ...updatedCoinQuery,
              $set: {
                preLoadedCoins: 0,
                quizCoins: userExists.quizCoins - amountLeftAfterPreloaded,
              },
            };
          }
        }
      } else {
        throw new NetworkError("Insufficient Fuels.", 400);
      }
    }

    const createdDripshop = await DripshopTable.create({
      firstName: body.firstName,
      lastName: body.lastName,
      redeemedFuels: fuel,
      userId: userExists._id,
      itemId: dripshopData._id,
      address: body.address,
      state: body.state,
      city: body.city,
      apartment: body.apartment || null,
      zipCode: body.zipCode,
      selectedSize: body.selectedSize || null,
    });
    let updatedUser = null;
    if (!isClaimed) {
      updatedUser = await UserTable.findOneAndUpdate(
        {
          _id: userExists._id,
        },
        updatedCoinQuery,
        { new: true }
      );
    } else {
      await UserCommunityTable.findOneAndUpdate(
        {
          userId: userExists._id,
        },
        { isClaimed: COMMUNITY_CHALLENGE_CLAIM_STATUS.CLAIMED }
      );
    }

    return {
      createdDripshop,
      updatedUser: isClaimed ? userExists : updatedUser,
    };
  }

  /**
   * @description This service is used to update the fuels of user
   * @param userExists
   */
  public async resetCurrentDayRewards(userExists: any) {
    try {
      const rewardsUpdatedOn = userExists?.currentDayRewards?.updatedAt;
      const days = getDaysNum(userExists, rewardsUpdatedOn) || 0;
      let updateObj = {};
      if (rewardsUpdatedOn && days >= 1) {
        updateObj = {
          $set: {
            "currentDayRewards.streak": 0,
            "currentDayRewards.quizCoins": 0,
            "currentDayRewards.goals": 0,
            "currentDayRewards.updatedAt": new Date(),
          },
          upsert: true,
        };
      }
      await UserTable.updateOne(
        {
          _id: userExists._id,
        },
        updateObj,
        { upsert: true }
      );
      return;
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }

  /**
   * @description This service is used to business category score of existing users
   * @param userId
   * @param data user profile data
   */
  public async updateBusinessSubScores(userId: any, data: any) {
    try {
      let updateObj = {};
      const businessProfile = await BusinessProfileTable.findOne({
        userId,
      });
      const ideaReport = businessProfile?.businessHistory[0]?.value || null;
      const overallScore = data?.businessScore?.current || 90;
      const ideaAnalysis = ideaReport["ideaAnalysis"] || null;
      const opsScore = ideaAnalysis[0]?.rating || overallScore;
      const productScore = ideaAnalysis[1]?.rating || overallScore;
      const growthScore = ideaAnalysis[2]?.rating || overallScore;
      updateObj = {
        operationsScore: opsScore,
        productScore,
        growthScore,
      };
      data.businessScore = { ...data.businessScore, ...updateObj };
      await UserTable.updateOne(
        {
          _id: userId,
        },
        updateObj,
        { upsert: true }
      );
      return data;
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }

  /**
   * @description This service is used get the gradient color details of current stage
   * @param data user profile data
   */
  public async getStageColorInfo(data: any) {
    try {
      const stageDetails = await StageTable.find({ _id: data.stage });
      const stageData = STAGE_COMPLETE["IDEA STAGE"];
      const colorInfo = {
        stage: {
          ...stageData.stageInfo.colorInfo,
        },
        score: {
          outer: stageData.stageInfo.colorInfo.outer,
        },
      };
      data["colorInfo"] = { ...colorInfo };
      return data;
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }
}

export default new UserDBService();
