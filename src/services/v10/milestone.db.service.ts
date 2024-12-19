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
} from "@app/utility";
import {
  EmployeeDBService,
  MilestoneDBService as MilestoneDBServiceV9,
  UserService,
} from "@services/v9";
import { UserDBService as UserDBServiceV6 } from "@app/services/v6";
import { EmployeeDBService as EmployeeDBServiceV10 } from "@app/services/v10";
import { ObjectId } from "mongodb";
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
      const [goals, stageDetails, showEmpNotification] = await Promise.all([
        this.getCurrentMilestoneGoals(userExists, businessProfile),
        UserDBServiceV6.getStageInfoUsingStageId(userExists),
        EmployeeDBServiceV10.ifEmployeeNotificationAvailable(
          userExists,
          businessProfile
        ),
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
        showEmpNotification,
        retryRequired,
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
        levelRewards = {};
      const { GOALS_OF_THE_DAY, THEMES, TOTAL_LEVELS } = MILESTONE_HOMEPAGE;
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
      let currentMilestoneId = businessProfile?.currentMilestone?.milestoneId;
      if (!currentMilestoneId) {
        initialMilestone = (
          await MilestoneTable.findOne({
            order: 1,
          })
        )._id;
      }
      const [lastMilestoneCompleted, availableDailyChallenges] =
        await Promise.all([
          MilestoneResultTable.findOne({
            userId: userIfExists._id,
          })
            .sort({ createdAt: -1 })
            .lean(),
          DailyChallengeTable.findOne({ userId: userIfExists._id }).lean(),
        ]);
      const [
        existingResponse,
        existingResponseWithPendingActions,
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
        getDaysNum(userIfExists, availableDailyChallenges["updatedAt"]) >= 1 ||
        currentMilestoneId.toString() !=
          lastMilestoneCompleted.milestoneId.toString()
      ) {
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
      if (
        (isCurrentDaysGoalsAvailable || !response?.tasks?.length) &&
        isAdvanceNextDay &&
        !response.isMilestoneHit &&
        getDaysNum(userIfExists, availableDailyChallenges["updatedAt"]) < 1
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
      if (
        response?.tasks[0]?.data.length > 0 &&
        response.tasks[0].title == GOALS_OF_THE_DAY.title
      ) {
        isLastDayOfMilestone =
          response?.tasks[0]?.data[0].day == currentMilestoneGoals[0].day;
      } else {
        isLastDayOfMilestone =
          lastMilestoneCompleted.day == currentMilestoneGoals[0].day;
      }
      if (
        response?.tasks[0]?.data[0] &&
        response.tasks[0].title == GOALS_OF_THE_DAY.title
      ) {
        currentGoal = response?.tasks[0]?.data[0];
        currentDay = response?.tasks[0]?.data[0]?.day;
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
      if (
        ![0, 6, 7].includes(currentActionNumber) &&
        userIfExists?.levelRewardClaimed
      ) {
        await UserTable.findOneAndUpdate(
          { _id: userIfExists._id },
          { $set: { levelRewardClaimed: false } },
          { upsert: true }
        );
      }
      const { levelsData, maxLevel, currentActiveLevel } = this.processLevels(
        currentMilestoneLevels,
        currentActionNumber,
        currentDay,
        currentMilestoneId,
        isLastDayOfMilestone,
        levelRewards,
        aiActions
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
      return response;
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
   * @param data user request body
   * @returns {*}
   */
  public async claimLevelReward(userExists: any, data: any) {
    try {
      let businessProfileObj = {},
        userUpdateObj = {},
        userSetObj: any = { levelRewardClaimed: true },
        todayCash = 0,
        todayToken = 0,
        updatedQuizCoins = LEVEL_COMPLETE_REWARD,
        businessScoreReward = 0;
      const { isLastDayOfMilestone, stageUnlockedInfo } = data;
      if (isLastDayOfMilestone) {
        businessProfileObj = await MilestoneDBServiceV9.moveToNextMilestone(
          userExists
        );
      }
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
        todayToken += resultSummary[0].title;
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
        MilestoneDBServiceV9.updateTodaysRewards(
          userExists,
          { coins: todayToken, cash: todayCash, rating: businessScoreReward },
          false,
          true
        ),
      ]);

      return true;
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }

  /**
   * @description get all ai actions for all milestones under the current stage
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
      const { GOALS_OF_THE_DAY } = MILESTONE_HOMEPAGE;
      const { NORMAL, SIMULATION, STORY, EVENT } = QUIZ_TYPE;
      // order -> quiz, story, simulation
      const order = { [NORMAL]: 0, [STORY]: 1, [SIMULATION]: 2, [EVENT]: 3 };
      const learningContent = await MilestoneDBServiceV9.getLearningContent(
        userIfExists,
        currentGoal
      );
      const quizLevelId = learningContent?.quizLevelId || null;
      const milestoneId = learningContent?.milestoneId || null;
      const allLearningContent = learningContent?.all?.sort(
        (a, b) => order[a?.type] - order[b?.type]
      );
      const currentDayIds = learningContent?.currentDayGoal?.map((obj) =>
        obj?.quizId?.toString()
      );
      if (
        allLearningContent &&
        response?.tasks[0]?.title != GOALS_OF_THE_DAY.title
      ) {
        response?.tasks?.unshift({
          title: GOALS_OF_THE_DAY.title,
          data: [],
          key: GOALS_OF_THE_DAY.key,
        });
      }
      const quizIds = allLearningContent?.map((obj) => obj?.quizId);
      const completedQuizzes = await QuizResult.find(
        {
          userId: userIfExists._id,
          quizId: { $in: quizIds },
        },
        { quizId: 1 }
      );
      const { simsAndEvent, learningActions } = this.processIndividualAction(
        allLearningContent,
        completedQuizzes,
        currentDayIds,
        quizLevelId,
        milestoneId
      );
      if (simsAndEvent.length > 0) {
        const updatedSimsAndEvent = simsAndEvent.sort(
          (a, b) => order[a?.type] - order[b?.type]
        );
        response?.tasks.push(...updatedSimsAndEvent);
      }
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
          const currentQuizId = learning?.quizId?.toString();
          const isQuizCompleted = completedQuizzes.some(
            (quiz) => quiz?.quizId?.toString() == currentQuizId
          );
          if (!isQuizCompleted && currentDayIds?.includes(currentQuizId)) {
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
   */
  private processLevels(
    currentMilestoneLevels: any,
    currentActionNumber: number,
    currentDay: number,
    currentMilestoneId: any,
    isLastDayOfMilestone: boolean,
    levelRewards: any,
    aiActions: any
  ) {
    try {
      let ifLevelCompleted = true,
        currentLevel = 0,
        ifCurrentGoalObject = false,
        maxLevel = 0,
        currentActiveLevel = 1;
      const { GOALS_OF_THE_DAY, LEVEL_REWARD } = MILESTONE_HOMEPAGE;
      const levelsData = [];
      const defaultCurrentActionInfo = {
        reward: LEVEL_REWARD.coins,
        type: 6,
        title: LEVEL_REWARD.title,
        key: LEVEL_REWARD.key,
        isLastDayOfMilestone,
      };
      const stageName = currentMilestoneLevels.stageName;
      currentMilestoneLevels.milestones.forEach((milestone) => {
        milestone.milestoneGoals.forEach((level) => {
          ifCurrentGoalObject =
            milestone?.milestoneId?.toString() ==
              currentMilestoneId?.toString() && level?.day == currentDay;
          ifLevelCompleted = ifCurrentGoalObject ? false : ifLevelCompleted;
          ++currentLevel;
          let currentActionInfo =
            currentActionNumber == 6
              ? { ...defaultCurrentActionInfo, ...levelRewards }
              : aiActions[0];
          if (
            currentActionInfo?.title == GOALS_OF_THE_DAY.title &&
            ifCurrentGoalObject
          ) {
            const totalAIActions = currentActionInfo?.data?.length;
            currentActionInfo.title = `Action: ${level.dayTitle}`;
            currentActionInfo["actions"] = `${totalAIActions} Decisions`;
            currentActionInfo["time"] = "2 min";
          }
          currentActiveLevel = ifCurrentGoalObject
            ? currentLevel
            : currentActiveLevel;
          maxLevel = level.level;
          levelsData.push({
            _id: currentLevel,
            title: `${stageName} - Level ${currentLevel}`,
            description: level.dayTitle,
            image: level?.levelImage,
            level: currentLevel,
            currentActionNumber: ifCurrentGoalObject
              ? currentActionNumber
              : ifLevelCompleted
              ? 7
              : 0,
            currentActionInfo: ifCurrentGoalObject
              ? currentActionInfo || defaultCurrentActionInfo
              : defaultCurrentActionInfo,
          });
        });
      });
      return { levelsData, maxLevel, currentActiveLevel };
    } catch (error) {
      throw new NetworkError(error.message, 404);
    }
  }
}
export default new MilestoneDBService();
