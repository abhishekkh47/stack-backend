import { NetworkError } from "@app/middleware";
import {
  UserTable,
  MilestoneTable,
  MilestoneResultTable,
  MilestoneGoalsTable,
  DailyChallengeTable,
  QuizLevelTable,
  QuizResult,
  StageTable,
  BusinessProfileTable,
} from "@app/model";
import {
  getDaysNum,
  MILESTONE_HOMEPAGE,
  STAGE_COMPLETE,
  TRIGGER_TYPE,
  convertDecimalsToNumbers,
  QUIZ_TYPE,
  LEVEL_COMPLETE_REWARD,
  DEFAULT_AI_ACTION_SCORE,
  MILESTONE_RESULT_COPY,
  DEFAULT_DELIVERABLE_NAME,
  hasGoalKey,
  mapHasGoalKey,
  ANALYTICS_EVENTS,
} from "@app/utility";
import {
  EmployeeDBService,
  MilestoneDBService as MilestoneDBServiceV9,
  UserService,
} from "@services/v9";
import { UserDBService as UserDBServiceV6 } from "@app/services/v6";
import { AnalyticsService } from "@app/services/v4";
import { ObjectId } from "mongodb";
const {
  GOALS_OF_THE_DAY,
  THEMES,
  TOTAL_LEVELS,
  LEVEL_REWARD,
  LEVEL_STATUS: { INACTIVE, REWARD_PENDING, REWARD_CLAIMED },
} = MILESTONE_HOMEPAGE;

class MilestoneDBService {
  /**
   * @description get milestone homepage content
   * @param userExists
   * @param businessProfile
   * @returns {*}
   */
  public async getUserMilestoneGoals(userExists: any, businessProfile: any) {
    try {
      let retryRequired = false;
      const [
        {
          response: goals,
          isFirstMilestone,
          isMilestonePlayable = true,
          defaultBackgroundImage = null,
        },
        stageDetails,
        milestoneNumber = 0,
      ] = await Promise.all([
        this.getCurrentMilestoneGoals(userExists, businessProfile),
        UserDBServiceV6.getStageInfoUsingStageId(userExists),
        this.getMilestoneOrder(businessProfile?.currentMilestone?.milestoneId),
      ]);
      const currentDayGoals = MilestoneDBServiceV9.getGoalOfTheDay(userExists);
      const tasks = goals?.tasks;
      if (tasks && tasks[tasks?.length - 1]?.currentActionNumber == 7) {
        retryRequired = await MilestoneDBServiceV9.updateUserMilestone(
          userExists
        );
      }
      return {
        ...goals,
        ...currentDayGoals,
        stageName: stageDetails?.title,
        retryRequired,
        isFirstMilestone,
        isMilestonePlayable,
        defaultBackgroundImage,
        milestoneNumber,
      };
    } catch (error) {
      throw new NetworkError(
        "Error occurred while retrieving new Milestone",
        400
      );
    }
  }

  /**
   * @description get current goals
   * @param userIfExists
   * @param businessProfile
   * @param advanceNextDay boolean flag whether need to advance to next day or not (valid for pro users)
   * @returns {*}
   */
  public async getCurrentMilestoneGoals(
    userIfExists: any,
    businessProfile: any,
    advanceNextDay: boolean = false
  ) {
    try {
      let response: any = {
        isMilestoneHit: false,
        tasks: [],
      };
      let isAdvanceNextDay = false,
        isLastDayOfMilestone = true,
        initialMilestone = null,
        currentDay = 1,
        levelRewards = {},
        currentIsFirstMilestone = false;
      /**
       * based on if the user has completed the current level,
       * check if we need to move to the next day
       */
      if (
        (advanceNextDay && userIfExists.isPremiumUser) ||
        userIfExists?.levelRewardClaimed
      ) {
        isAdvanceNextDay = true;
      } else if (advanceNextDay && !userIfExists.isPremiumUser) {
        throw new NetworkError(
          "Become a pro user to get unlimited access",
          400
        );
      }
      // get the current milestone of user
      let currentMilestoneId = businessProfile?.currentMilestone?.milestoneId;
      const [
        lastMilestoneCompleted,
        availableDailyChallenges,
        firstMilestone,
        currentMilestone,
      ] = await Promise.all([
        MilestoneResultTable.findOne({ userId: userIfExists._id })
          .sort({ createdAt: -1 })
          .lean(),
        DailyChallengeTable.findOne({ userId: userIfExists._id }).lean(),
        MilestoneTable.findOne({ order: 1 }),
        MilestoneTable.findOne({ _id: currentMilestoneId }),
      ]);

      /**
       * If the user has reached to the milestone which is currently locked,
       * we return a standard response to UI to let the user know about upcoming content
       */
      if (currentMilestoneId && currentMilestone.locked) {
        return {
          response: false,
          isFirstMilestone: false,
          isMilestonePlayable: false,
          defaultBackgroundImage: "journey-35.webp",
        };
      }
      /**
       * If the user have not completed any milestone or the current milestone info is not available
       * we assign them the first milestone by default
       */
      if (!currentMilestoneId) {
        initialMilestone = firstMilestone._id;
        currentIsFirstMilestone = true;
      } else if (
        currentMilestoneId?.toString() == firstMilestone?._id.toString()
      ) {
        currentIsFirstMilestone = true;
      }
      const [
        existingResponse, // deprecated
        existingResponseWithPendingActions, // response will be received when override=true
        milestoneData,
        stageData,
      ] = await Promise.all([
        MilestoneDBServiceV9.handleAvailableDailyChallenges(
          userIfExists,
          businessProfile,
          availableDailyChallenges,
          lastMilestoneCompleted
        ),
        MilestoneDBServiceV9.handleAvailableDailyChallenges(
          userIfExists,
          businessProfile,
          availableDailyChallenges,
          lastMilestoneCompleted,
          true
        ),
        MilestoneTable.find(),
        StageTable.find(),
      ]);
      const tasks = existingResponseWithPendingActions?.tasks;
      if (existingResponse) {
        response = existingResponse;
      } else if (tasks && tasks[0]?.data?.length > 0) {
        /**
         * If all the ai actions f a day/level not completed,
         * then just to update the timestamp in the daily challenge collection,
         * we do an empty update.
         * This was done so that we can track the day, when the user completed the ai actions
         */
        await DailyChallengeTable.findOneAndUpdate(
          {
            userId: userIfExists._id,
          },
          { $set: {} }
        );
        response = existingResponseWithPendingActions;
      } else if (
        // when user signup/login after updating app on day-1, return day-1 goals of default Milestone
        !lastMilestoneCompleted ||
        !currentMilestoneId
      ) {
        response = await MilestoneDBServiceV9.getFirstDayMilestoneGoals(
          userIfExists
        );
      } else if (
        currentMilestoneId?.toString() !=
        lastMilestoneCompleted?.milestoneId?.toString()
      ) {
        /**
         * If the user has been moved to the new milestone,
         * We get the next milestones content
         */
        response = await MilestoneDBServiceV9.getNextDayMilestoneGoals(
          userIfExists,
          businessProfile,
          lastMilestoneCompleted,
          existingResponseWithPendingActions,
          availableDailyChallenges
        );
      }
      const isCurrentDaysGoalsAvailable =
        response?.tasks[0]?.title == GOALS_OF_THE_DAY.title &&
        response?.tasks[0]?.data.length == 0;
      /**
       * If user is pro, who wants to move to next day (isAdvanceNextDay=true)
       * Then we move them to next day and fetch next day challenges
       *
       * Note - This is currently deprecated since the users are now moved to next day
       * when they complete and claim the level rewards. So the users do not have any option to
       * explicitly move to next day
       */
      if (
        (isCurrentDaysGoalsAvailable || !response?.tasks?.length) &&
        isAdvanceNextDay &&
        !response.isMilestoneHit
      ) {
        response = await MilestoneDBServiceV9.getNextDayMilestoneGoals(
          userIfExists,
          businessProfile,
          lastMilestoneCompleted,
          existingResponseWithPendingActions,
          availableDailyChallenges
        );
      }
      currentMilestoneId = response?.tasks[0]?.data[0].milestoneId;
      if (!currentMilestoneId) {
        currentMilestoneId = businessProfile?.currentMilestone?.milestoneId;
      }
      if (currentMilestoneId?.toString() == firstMilestone?._id.toString()) {
        currentIsFirstMilestone = true;
      }
      /**
       * Get all the goals in the current milestone
       * and all the level in current milestone
       */
      const [currentMilestoneGoals, currentMilestoneLevels] = await Promise.all(
        [
          MilestoneGoalsTable.find({
            milestoneId: currentMilestoneId,
          })
            .sort({ day: -1 })
            .lean(),
          this.getLevelsInCurrentStage(userIfExists),
        ]
      );
      let currentGoal = {};
      /**
       * if we have ai actions available for current day,
       * then we get the info for actions and update the response object
       */
      if (
        response?.tasks[0]?.data.length > 0 &&
        response.tasks[0].title == GOALS_OF_THE_DAY.title
      ) {
        currentGoal = response?.tasks[0]?.data[0];
        currentDay = response?.tasks[0]?.data[0]?.day;
        currentMilestoneId = response?.tasks[0]?.data[0].milestoneId;
        /**
         * Get dependency actions if not completed and add them to the current ai actions array
         */
        const depActionDetails = await this.getDependencyActions(
          businessProfile,
          response
        );
        if (depActionDetails.length) {
          response?.tasks[0].data.unshift(...depActionDetails);
        }
        let goal = currentMilestoneGoals.find(
          (goal) => goal.key == response?.tasks[0]?.data[0]?.key
        );
        response?.tasks[0]?.data.forEach((action) => {
          action.inputTemplate["template"] = 1;
          action["deliverableName"] = goal?.deliverableName ?? action.key;
          action["template"] = 1;
        });
        isLastDayOfMilestone =
          response?.tasks[0]?.data[0].day == currentMilestoneGoals[0].day;
      } else {
        isLastDayOfMilestone =
          lastMilestoneCompleted.day == currentMilestoneGoals[0].day;
      }

      /**
       * Add the reward details to the response object which need to shown on completion of all ai actions of current day
       * Also add the flag for notifcation screen and last goal of milestone
       */
      if (
        response?.tasks[0]?.data[0] &&
        response.tasks[0].title == GOALS_OF_THE_DAY.title
      ) {
        currentMilestoneId = response?.tasks[0]?.data[0].milestoneId;
        const [ifOtherMilestoneCompleted, quizLevelData] = await Promise.all([
          MilestoneResultTable.findOne({
            userId: userIfExists._id,
            milestoneId: { $ne: currentMilestoneId },
          }),
          QuizLevelTable.findOne({
            milestoneId: currentMilestoneId,
            day: response?.tasks[0]?.data[0].day,
          }),
        ]);
        if (quizLevelData) {
          response.tasks[0] = {
            ...response.tasks[0],
            resultCopyInfo: quizLevelData?.actions[0]?.resultCopyInfo?.pass,
          };
        }
        if (response?.tasks[0]?.data.length == 1 && isLastDayOfMilestone) {
          if (!ifOtherMilestoneCompleted) {
            response.tasks[0].data[0] = {
              ...response?.tasks[0]?.data[0],
              showNotificationScreen: true,
              lastGoalOfMilestone: true,
            };
          } else {
            response.tasks[0].data[0] = {
              ...response?.tasks[0]?.data[0],
              lastGoalOfMilestone: true,
            };
          }
        }
      } else {
        currentGoal = lastMilestoneCompleted;
        currentDay = lastMilestoneCompleted.day;
      }

      /**
       * If current day goals are not available, then check if the current milestone is completed
       */
      if (
        (currentMilestoneId &&
          response?.tasks[0]?.title != GOALS_OF_THE_DAY.title) ||
        (response?.tasks[0]?.title == GOALS_OF_THE_DAY.title &&
          response?.tasks[0]?.data?.length == 0)
      ) {
        response.isMilestoneHit =
          await MilestoneDBServiceV9.checkIfMilestoneHit(
            lastMilestoneCompleted,
            currentMilestoneId
          );
      } else {
        response.isMilestoneHit = false;
      }

      /**
       * Add and format all the learning actions in the response object for current day
       */
      response = await this.populateMilestoneTasks(
        userIfExists,
        response,
        currentGoal
      );
      const currentMilestoneDetails = milestoneData.find(
        (obj) =>
          obj._id.toString() ==
          (currentMilestoneId?.toString() || initialMilestone.toString())
      );
      const nextMilestoneDetails = milestoneData.find(
        (obj) => obj.order == currentMilestoneDetails.order + 1
      );

      // if last day of milestone, add stage transition and unlocked employee details if available
      if (
        currentMilestoneDetails?.stageId?.toString() !=
          nextMilestoneDetails?.stageId?.toString() &&
        isLastDayOfMilestone
      ) {
        const employees = await EmployeeDBService.getUnlockedEmployeeDetails(
          currentMilestoneDetails?.stageId,
          TRIGGER_TYPE.STAGE
        );
        const newStage = stageData.find(
          (obj) =>
            obj._id.toString() == nextMilestoneDetails?.stageId?.toString()
        );
        const newStageTitle = newStage?.title;
        const newStageDetails =
          STAGE_COMPLETE[newStageTitle] || STAGE_COMPLETE["ANGEL STAGE"];
        levelRewards = {
          stageUnlockedInfo: {
            ...newStageDetails,
            stageInfo: {
              ...newStageDetails.stageInfo,
              name: newStageTitle,
            },
          },
          employees,
        };
      }
      if (response?.tasks[0]?.title == GOALS_OF_THE_DAY.title) {
        if (response?.tasks[0]?.data.length > 0) {
          response.isMilestoneHit = false;
        } else if (response?.tasks[0]?.data.length == 0) {
          response?.tasks.shift();
        }
      }
      const aiActions = response.tasks;
      let currentActionNumber =
        aiActions.length >= 1 && aiActions.length <= 5
          ? 6 - aiActions?.length
          : 6;
      // if reward claim flag is true in DB and current action number is not 0, 6 or 7, reset the flag
      if (
        ![INACTIVE, REWARD_CLAIMED, REWARD_PENDING].includes(
          currentActionNumber
        ) &&
        userIfExists?.levelRewardClaimed
      ) {
        await UserTable.findOneAndUpdate(
          { _id: userIfExists._id },
          { $set: { levelRewardClaimed: false } },
          { upsert: true }
        );
      }
      /**
       * add required metadata to each level object required by FE
       */
      const { levelsData, maxLevel, currentActiveLevel } = this.processLevels(
        currentMilestoneLevels,
        currentActionNumber,
        currentDay,
        currentMilestoneId,
        isLastDayOfMilestone,
        levelRewards,
        aiActions,
        currentIsFirstMilestone,
        userIfExists.isPremiumUser
      );
      response = {
        ...response,
        tasks: levelsData,
        theme: maxLevel * 6 > 60 ? THEMES.LIGHT : THEMES.DARK,
        colorInfo: currentMilestoneLevels.colorInfo,
        remainingLevelInfo: {
          _id: "1",
          description: `${TOTAL_LEVELS - maxLevel} Levels to IPO`,
        },
        currentActiveLevel,
      };
      return { response, isFirstMilestone: currentIsFirstMilestone };
    } catch (error) {
      throw new NetworkError("Error occurred while retrieving milestones", 400);
    }
  }

  /**
   * @description get all levels in current active stage
   * @param userIfExists
   * @returns {*}
   */
  public async getLevelsInCurrentStage(userIfExists: any) {
    try {
      let stageId = userIfExists.stage;
      if (!stageId) {
        stageId = (await UserService.getCurrentStage(userIfExists))._id;
      }
      const milestoneLevels = await StageTable.aggregate([
        {
          $match: { _id: new ObjectId(stageId) },
        },
        {
          $lookup: {
            from: "milestones",
            localField: "_id",
            foreignField: "stageId",
            as: "milestones",
          },
        },
        {
          $addFields: {
            milestones: {
              $sortArray: { input: "$milestones", sortBy: { order: 1 } },
            },
          },
        },
        {
          $unwind: {
            path: "$milestones",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "milestone_goals",
            localField: "milestones._id",
            foreignField: "milestoneId",
            as: "milestoneGoals",
          },
        },
        {
          $addFields: {
            milestoneGoals: {
              $map: {
                input: {
                  $reduce: {
                    input: "$milestoneGoals",
                    initialValue: [],
                    in: {
                      $cond: [
                        {
                          $in: [
                            {
                              day: "$$this.day",
                              dayTitle: "$$this.dayTitle",
                              level: "$$this.level",
                              levelImage: "$$this.levelImage",
                            },
                            "$$value",
                          ],
                        },
                        "$$value",
                        {
                          $concatArrays: [
                            "$$value",
                            [
                              {
                                day: "$$this.day",
                                dayTitle: "$$this.dayTitle",
                                level: "$$this.level",
                                levelImage: "$$this.levelImage",
                              },
                            ],
                          ],
                        },
                      ],
                    },
                  },
                },
                as: "goal",
                in: {
                  day: "$$goal.day",
                  dayTitle: "$$goal.dayTitle",
                  level: "$$goal.level",
                  levelImage: "$$goal.levelImage",
                },
              },
            },
          },
        },
        {
          $addFields: {
            milestoneGoals: {
              $sortArray: {
                input: "$milestoneGoals",
                sortBy: { day: 1 },
              },
            },
          },
        },
        {
          $group: {
            _id: "$_id",
            stageName: { $first: "$title" },
            colorInfo: { $first: "$homepageColorInfo" },
            milestones: {
              $push: {
                milestoneId: "$milestones._id",
                milestoneOrder: "$milestones.order",
                milestoneGoals: "$milestoneGoals",
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            stageName: 1,
            colorInfo: 1,
            milestones: 1,
          },
        },
      ]);

      milestoneLevels[0].colorInfo = convertDecimalsToNumbers(
        milestoneLevels[0].colorInfo
      );
      return milestoneLevels[0];
    } catch (error) {
      throw new NetworkError("Error occurred while fetching levels", 400);
    }
  }

  /**
   * @description get event information
   * @param userExists
   * @param businessProfile
   * @param data user request body
   * @returns {*}
   */
  public async claimLevelReward(
    userExists: any,
    businessProfile: any,
    data: any
  ) {
    try {
      let businessProfileObj = {},
        userUpdateObj = {},
        userSetObj: any = { levelRewardClaimed: true },
        todayCash = 0,
        updatedQuizCoins = LEVEL_COMPLETE_REWARD,
        businessScoreReward = 0,
        milestoneDetails = null;
      const { isLastDayOfMilestone, stageUnlockedInfo, employees = [] } = data;
      /**
       * If last day of current milestones,
       * then move the user to next milestone
       * and send an event for the completed milestone
       */
      if (isLastDayOfMilestone) {
        [businessProfileObj, milestoneDetails] = await Promise.all([
          MilestoneDBServiceV9.moveToNextMilestone(userExists),
          MilestoneTable.findOne({
            _id: businessProfile?.currentMilestone?.milestoneId,
          }),
        ]);
        AnalyticsService.sendEvent(
          ANALYTICS_EVENTS.MILESTONE_COMPLETED,
          {
            "Milestone Name": milestoneDetails?.milestone,
          },
          {
            user_id: userExists._id,
          }
        );
      }
      /**
       * If the stage has also been updated,
       * then update the rewards to the user claimed for the stage transition
       * Also, move the user to the next stage
       */
      if (stageUnlockedInfo) {
        const newStage = stageUnlockedInfo?.stageInfo?.name;
        const newStageDetails = await StageTable.findOne({ title: newStage });
        const resultSummary = stageUnlockedInfo?.resultSummary;
        updatedQuizCoins += resultSummary[0].title;
        businessScoreReward += resultSummary[2].title;
        userUpdateObj = {
          quizCoins: updatedQuizCoins,
          cash: resultSummary[1].title,
          "businessScore.current": businessScoreReward,
          "businessScore.operationsScore": businessScoreReward,
          "businessScore.productScore": businessScoreReward,
          "businessScore.growthScore": businessScoreReward,
        };
        userSetObj = { ...userSetObj, stage: newStageDetails._id };
        todayCash += resultSummary[1].title;
      }
      await Promise.all([
        UserTable.findOneAndUpdate(
          { _id: userExists._id },
          {
            $set: userSetObj,
            $inc: { ...userUpdateObj, quizCoins: updatedQuizCoins },
          },
          { upsert: true }
        ),
        BusinessProfileTable.findOneAndUpdate(
          { userId: userExists._id },
          { $set: businessProfileObj },
          { upsert: true }
        ),
        // update the current day rewards
        MilestoneDBServiceV9.updateTodaysRewards(
          userExists,
          {
            coins: updatedQuizCoins,
            cash: todayCash,
            rating: businessScoreReward,
          },
          false,
          false
        ),
        employees.length
          ? EmployeeDBService.unlockEmployee(userExists, employees)
          : Promise.resolve(),
      ]);

      return true;
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }

  /**
   * @description add all learning actions to thr response object in correct order
   * @param userIfExists
   * @param response current response object
   * @param currentGoal current or last goal played
   */
  private async populateMilestoneTasks(
    userIfExists: any,
    response: any,
    currentGoal: any
  ) {
    try {
      const { NORMAL, SIMULATION, STORY, EVENT } = QUIZ_TYPE;
      // order -> quiz, story, simulation, event
      const order = { [NORMAL]: 0, [STORY]: 1, [SIMULATION]: 2, [EVENT]: 3 };
      // get the learning content for each day of current milestone where day <= currentday
      const learningContent = await MilestoneDBServiceV9.getLearningContent(
        userIfExists,
        currentGoal
      );
      const quizLevelId = learningContent?.quizLevelId || null;
      const milestoneId = learningContent?.milestoneId || null;
      // sort the learning content in the required order to be displayed in UI
      learningContent?.all?.sort((a, b) => order[a?.type] - order[b?.type]);
      // get the object id of all learning content in current day
      const currentDayIds = learningContent?.currentDayGoal?.map((obj) =>
        obj?.quizId?.toString()
      );
      /**
       * if the tasks array in main response object do not contain the 'Daily Quest' object
       * then we add that to the tasks array to add learning content
       */
      if (
        learningContent?.all &&
        response?.tasks[0]?.title != GOALS_OF_THE_DAY.title
      ) {
        response?.tasks?.unshift({
          title: GOALS_OF_THE_DAY.title,
          data: [],
          key: GOALS_OF_THE_DAY.key,
        });
      }
      // check if the learning content is already completed or not
      const quizIds = learningContent?.all?.map((obj) => obj?.quizId);
      const completedQuizzes = await QuizResult.find(
        {
          userId: userIfExists._id,
          quizId: { $in: quizIds },
        },
        { quizId: 1 }
      );
      /**
       * Get all the learning content in a certain format
       * we divide them in two parts:
       * one contains simulations and event
       * other one contains quizzes and case studies
       */
      const { simsAndEvent, learningActions } = this.processIndividualAction(
        learningContent?.all,
        completedQuizzes,
        currentDayIds,
        quizLevelId,
        milestoneId
      );
      if (simsAndEvent.length > 0) {
        simsAndEvent.sort((a, b) => order[a?.type] - order[b?.type]);
        response?.tasks.push(...simsAndEvent);
      }
      // add learning content to the tasks array in the response object
      if (learningActions.length) {
        if (response?.tasks.length > 1) {
          response?.tasks.unshift(...learningActions);
        } else {
          response?.tasks?.push(...learningActions);
        }
      }
      return response;
    } catch (error) {
      throw new NetworkError(error.message, 404);
    }
  }

  /**
   * @description Process individual action details
   * @param allLearningContent all learning content details
   * @param completedQuizzes array of completed quizzes available in quiz_results collection
   * @param currentDayIds quizzes available for current day
   * @param quizLevelId reference id from quiz_levels collection
   * @param milestoneId current milestone id
   * @returns {*} learning content of current level
   */
  private processIndividualAction(
    allLearningContent: any,
    completedQuizzes: any,
    currentDayIds: any,
    quizLevelId: any,
    milestoneId: any
  ) {
    try {
      let actionDetails = {},
        simsAndEvent = [],
        learningActions = [];
      const { NORMAL, SIMULATION, STORY, EVENT } = QUIZ_TYPE;
      allLearningContent?.forEach((learning) => {
        if (learning) {
          // check if learning already completed or not
          const currentQuizId = learning?.quizId?.toString();
          const isQuizCompleted = completedQuizzes.some(
            (quiz) => quiz?.quizId?.toString() == currentQuizId
          );
          /**
           * If the learning is not completed, and it belongs to the current day
           * then only we make is available to the users
           */
          if (!isQuizCompleted && currentDayIds?.includes(currentQuizId)) {
            /**
             * update the response format for each type of learning content
             * which is to be displayed in the pop-up in UI
             */
            if (learning.type == SIMULATION || learning.type == EVENT) {
              actionDetails = {
                actions:
                  learning.type == SIMULATION ? "5 Questions" : "1 Decision",
                time: learning.type == SIMULATION ? "3 min" : "1 min",
              };
              simsAndEvent.push({
                ...learning,
                title:
                  learning.type == SIMULATION
                    ? `SMS: ${learning.title}`
                    : learning.title,
                quizLevelId,
                milestoneId,
                ...actionDetails,
              });
            } else if (learning.type == NORMAL || learning.type == STORY) {
              actionDetails = {
                actions: learning.type == NORMAL ? "12 Terms" : "28 Slides",
                time: learning.type == NORMAL ? "1 min" : "3 min",
                rating: learning.type == NORMAL ? 4.9 : 4.8,
                totalRatings: learning.type == NORMAL ? "4.6K" : "4.2K",
              };
              learningActions.push({
                ...learning,
                resultCopyInfo: null,
                quizLevelId,
                milestoneId,
                ...actionDetails,
              });
            }
          }
        }
      });
      return { simsAndEvent, learningActions };
    } catch (error) {
      throw new NetworkError(error.message, 404);
    }
  }

  /**
   * @description Process each level in current stage
   * @param currentMilestoneLevels current milestone levels
   * @param currentActionNumber current action number to be attempted
   * @param currentDay current day of milestone
   * @param currentMilestoneId current milestone ID
   * @param isLastDayOfMilestone whether current day is the last day of milestone
   * @param levelRewards rewards on completion of the level
   * @param aiActions all ai actions and learning content in current milestone
   * @param currentIsFirstMilestone whether current milestone is the first milestone
   * @param isPremiumUser whether the user is pro or not
   * @returns {*} current active level details
   */
  private processLevels(
    currentMilestoneLevels: any,
    currentActionNumber: number,
    currentDay: number,
    currentMilestoneId: any,
    isLastDayOfMilestone: boolean,
    levelRewards: any,
    aiActions: any,
    currentIsFirstMilestone: boolean,
    isPremiumUser: boolean
  ) {
    try {
      const { AI_ACTIONS } = QUIZ_TYPE;
      let ifLevelCompleted = true,
        currentLevel = 0,
        ifCurrentGoalObject = false,
        maxLevel = 0,
        currentActiveLevel = 1;
      const levelsData = [];
      let defaultCurrentActionInfo;
      const stageName = currentMilestoneLevels.stageName;
      /**
       * Each stage has multiple milestone
       * Iterate through each milestone
       */
      currentMilestoneLevels.milestones.forEach((milestone) => {
        /**
         * Each milestone contains multiple goals/actions
         */
        milestone.milestoneGoals.forEach((level) => {
          const {
            day = 0,
            dayTitle = null,
            levelImage = null,
            level: levelNumber,
          } = level;
          // check if the current action comes under the current day of current milestone
          ifCurrentGoalObject =
            milestone?.milestoneId?.toString() ==
              currentMilestoneId?.toString() && day == currentDay;
          ifLevelCompleted = ifCurrentGoalObject ? false : ifLevelCompleted;
          // increment the level for each iteration of each milestone
          ++currentLevel;

          /**
           * Add level rewards based on the level and the user type
           * rewards are different for pro and non-pro users
           */
          defaultCurrentActionInfo = {
            title: `Level ${currentLevel} Complete: Claim Your Rewards!`,
            rewards: isPremiumUser
              ? [...LEVEL_REWARD.PRO_USER]
              : [...LEVEL_REWARD.NON_PRO_USER],
            type: 6,
            isLastDayOfMilestone,
            key: "reward",
          };
          /**
           * For the first level, the rewards are same for all users
           */
          if (currentLevel == REWARD_PENDING && currentIsFirstMilestone) {
            defaultCurrentActionInfo.rewards = LEVEL_REWARD.LEVEL_ONE;
          }
          /**
           * update the action info according to the reward pending status
           * if other actions are remaining before reward claim, assign the content accordingly
           */
          let currentActionInfo =
            currentActionNumber == REWARD_PENDING
              ? { ...defaultCurrentActionInfo, ...levelRewards }
              : aiActions[0];
          if (
            currentActionInfo?.title == GOALS_OF_THE_DAY.title &&
            ifCurrentGoalObject
          ) {
            const totalAIActions = currentActionInfo?.data?.length;
            currentActionInfo.title = `Action: ${dayTitle}`;
            currentActionInfo["actions"] = `${totalAIActions} Decisions`;
            currentActionInfo["time"] = "2 min";
            currentActionInfo["type"] = AI_ACTIONS;
          }
          currentActiveLevel = ifCurrentGoalObject
            ? currentLevel
            : currentActiveLevel;
          const levelActionNumber = ifCurrentGoalObject
            ? currentActionNumber
            : ifLevelCompleted
            ? REWARD_CLAIMED
            : INACTIVE;
          if (
            currentMilestoneId?.toString() == milestone.milestoneId?.toString()
          ) {
            maxLevel = levelNumber;
            levelsData.push({
              _id: currentLevel,
              title: `${stageName} - Level ${currentLevel}`,
              description: dayTitle,
              image: levelImage,
              level: currentLevel,
              currentActionNumber: levelActionNumber,
              currentActionInfo: ![INACTIVE, REWARD_CLAIMED].includes(
                levelActionNumber
              )
                ? ifCurrentGoalObject
                  ? currentActionInfo || defaultCurrentActionInfo
                  : defaultCurrentActionInfo
                : null,
            });
          }
        });
      });
      return { levelsData, maxLevel, currentActiveLevel };
    } catch (error) {
      throw new NetworkError(error.message, 404);
    }
  }

  /**
   * @description Process each level in current stage
   * @param userIfExists
   * @param key ai action key
   * @returns {*} current active level details
   */
  public async getResultSummaryDetails(userIfExists: any, key: string) {
    try {
      const result = await MilestoneGoalsTable.aggregate([
        // Step 1: Match the document with the given key to get `day` and `milestoneId`
        { $match: { key } },
        // Step 2: Use a $lookup to find all documents with the same `day` and `milestoneId`
        {
          $lookup: {
            from: "milestone_goals",
            let: { day: "$day", milestoneId: "$milestoneId" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$day", "$$day"] },
                      { $eq: ["$milestoneId", "$$milestoneId"] },
                      { $ne: ["$key", "ideaValidation"] },
                    ],
                  },
                },
              },
              { $sort: { order: 1 } },
            ],
            as: "matchingGoals",
          },
        },
        { $unwind: "$matchingGoals" }, // Flatten matching goals
        { $replaceRoot: { newRoot: "$matchingGoals" } }, // Replace root with the matched goals
        // Step 3: Lookup `name` for each `key` from the `suggestions_screen_copies` collection
        {
          $lookup: {
            from: "suggestions_screen_copies",
            localField: "key",
            foreignField: "key",
            as: "suggestionDetails",
          },
        },
        { $unwind: "$suggestionDetails" }, // Flatten suggestion details
        // Step 4: Lookup score for each `key` from the `business_profiles` collection
        {
          $lookup: {
            from: "business-profiles",
            let: { key: "$key" },
            pipeline: [
              {
                $match: {
                  userId: userIfExists._id,
                },
              },
              {
                $addFields: {
                  completedActionsArray: {
                    $objectToArray: "$completedActions",
                  }, // Convert completedActions to an array
                },
              },
              {
                $unwind: {
                  path: "$completedActionsArray",
                  preserveNullAndEmptyArrays: true,
                },
              }, // Flatten the array
              {
                $match: {
                  $expr: { $eq: ["$completedActionsArray.k", "$$key"] }, // Match the key
                },
              },
              {
                $project: {
                  score: "$completedActionsArray.v.score", // Project the score
                },
              },
            ],
            as: "scores",
          },
        },
        { $unwind: { path: "$scores", preserveNullAndEmptyArrays: true } }, // Include documents even if no score exists
        // Step 5: Combine the data into a simplified structure
        {
          $project: {
            key: 1,
            day: 1,
            milestoneId: 1,
            title: "$suggestionDetails.name",
            score: "$scores.score", // Extract score value
            deliverableName: 1,
          },
        },
      ]);

      result.forEach(
        (obj) => (obj["score"] = Number(obj?.score) ?? DEFAULT_AI_ACTION_SCORE)
      );
      const deliverableName =
        result[0]?.deliverableName || DEFAULT_DELIVERABLE_NAME;
      return {
        deliverableName,
        actions: result,
      };
    } catch (error) {
      throw new NetworkError(error.message, 404);
    }
  }

  /**
   * @description Update rewards after completing AI Actions
   * @param userExists
   * @param resultSummary
   * @returns {*}
   */
  public async updateAIActionReward(userExists: any, resultSummary: any) {
    try {
      const { updatedUserCash, updatedUserTokens, updatedUserRating } =
        this.updatedUserData(resultSummary);
      await UserTable.updateOne(
        { _id: userExists._id },
        {
          $inc: {
            cash: updatedUserCash,
            quizCoins: updatedUserTokens,
            "businessScore.current": updatedUserRating,
            "businessScore.operationsScore": updatedUserRating,
            "businessScore.productScore": updatedUserRating,
            "businessScore.growthScore": updatedUserRating,
          },
        },
        { upsert: true }
      );
      return true;
    } catch (error) {
      throw new NetworkError(error.message, 404);
    }
  }

  /**
   * @description Get the dependency action details
   * @param businessProfile
   * @param response initial response with ai actions only
   * @returns {*}
   */
  public async getDependencyActions(businessProfile: any, response: any) {
    try {
      const currentActions = [];
      const depActionsSet = new Set();
      response?.tasks[0]?.data.forEach((action) => {
        currentActions.push(action?.key);
        action?.dependency?.forEach((key) => {
          /**
           * check if the action info available in the main business profile object
           * since earlier, the action response was directly being saved in the main object of the document
           */
          const hasGoalInProfile = hasGoalKey(businessProfile, key);
          /**
           * also check if the action response available in the 'completedActions' object
           */
          const hasGoalInCompletedActions = mapHasGoalKey(
            businessProfile.completedActions,
            key
          );
          if (
            !(hasGoalInProfile || hasGoalInCompletedActions) &&
            !currentActions.includes(key)
          ) {
            depActionsSet.add(key);
          }
        });
      });
      const depActions = Array.from(depActionsSet);
      const currentMilestoneGoals = await MilestoneGoalsTable.find({
        key: { $in: depActions },
      }).lean();
      const goalsData = await MilestoneDBServiceV9.suggestionScreenInfo(
        currentMilestoneGoals
      );
      return goalsData;
    } catch (error) {
      throw new NetworkError(error.message, 404);
    }
  }

  /**
   * @description Update rewards collected today
   * @param userIfExists
   * @param resultSummary contains data to be updated
   * @returns {*}
   */
  public async updateTodaysRewardsForAIActions(
    userIfExists: any,
    resultSummary: any
  ) {
    try {
      const { updatedUserCash, updatedUserTokens, updatedUserRating } =
        this.updatedUserData(resultSummary);
      const rewardsUpdatedOn = userIfExists?.currentDayRewards?.updatedAt;
      const days = getDaysNum(userIfExists, rewardsUpdatedOn) || 0;
      let updateObj = {};
      /**
       * if the rewards have been updated on the same day before,
       * then increment the current values
       * otherwise reset the values
       */
      if (days < 1) {
        updateObj = {
          $inc: {
            "currentDayRewards.quizCoins": updatedUserTokens,
            "currentDayRewards.cash": updatedUserCash,
            "currentDayRewards.scoreProgress": updatedUserRating,
          },
          $set: {
            "currentDayRewards.updatedAt": new Date(),
          },
        };
      } else {
        updateObj = {
          $set: {
            "currentDayRewards.quizCoins": updatedUserTokens,
            "currentDayRewards.cash": updatedUserCash,
            "currentDayRewards.scoreProgress": updatedUserRating,
            "currentDayRewards.updatedAt": new Date(),
          },
          upsert: true,
        };
      }
      await UserTable.updateOne(
        {
          _id: userIfExists._id,
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
   * @description Calculate the incremental reward of each type
   * @param resultSummary contains data to be updated
   * @returns {*}
   */
  updatedUserData(resultSummary: any) {
    const { actions } = resultSummary;
    const averageRatingPercentage =
      actions.reduce((acc, val) => acc + val.score, 0) / actions.length / 100;
    const rewardDetails = MILESTONE_RESULT_COPY.resultSummary;
    const updatedUserCash = Math.floor(
      rewardDetails[0].title * averageRatingPercentage
    );
    const updatedUserTokens = Math.floor(
      rewardDetails[1].title * averageRatingPercentage
    );
    const updatedUserRating = Math.floor(
      rewardDetails[2].title * averageRatingPercentage
    );
    return { updatedUserCash, updatedUserTokens, updatedUserRating };
  }

  /**
   * @description Get the order of current milestone
   * @param milestoneId
   * @returns {*}
   */
  public async getMilestoneOrder(milestoneId: any) {
    try {
      const milestone = await MilestoneTable.findOne({ _id: milestoneId });
      return milestone?.order;
    } catch (error) {
      throw new NetworkError((error as Error).message, 400);
    }
  }
}
export default new MilestoneDBService();
