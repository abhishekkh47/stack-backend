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
} from "@app/model";
import {
  getDaysNum,
  MILESTONE_HOMEPAGE,
  STAGE_COMPLETE,
  TRIGGER_TYPE,
  convertDecimalsToNumbers,
} from "@app/utility";
import {
  EmployeeDBService,
  MilestoneDBService as MilestoneDBServiceV9,
  UserService,
} from "@services/v9";
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
      const [goals] = await Promise.all([
        this.getCurrentMilestoneGoals(userExists, businessProfile),
      ]);

      const currentDayGoals = MilestoneDBServiceV9.getGoalOfTheDay(userExists);
      return { ...goals, ...currentDayGoals };
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
        learningActions = [],
        isLastDayOfMilestone = true,
        lockedQuest = false,
        lockedAction = true,
        isSimulationAvailable = false,
        initialMilestone = null,
        simsAndEvent = [],
        actionDetails = {},
        currentDay = 1,
        ifCurrentGoalObject = false,
        ifLevelCompleted = true;
      const { GOALS_OF_THE_DAY, AI_ACTIONS } = MILESTONE_HOMEPAGE;
      if (
        (advanceNextDay && userIfExists.isPremiumUser) ||
        userIfExists?.levelRewardClaimed
      ) {
        isAdvanceNextDay = true;
        if (userIfExists?.levelRewardClaimed) {
          UserTable.findOneAndUpdate(
            { _id: userIfExists._id },
            { $set: { levelRewardClaimed: false } },
            { upsert: true }
          );
        }
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
      const currentMilestoneGoals = await MilestoneGoalsTable.find({
        milestoneId: currentMilestoneId,
      })
        .sort({ day: -1 })
        .lean();
      const currentMilestoneLevels = await this.getLevelsInCurrentStage(
        userIfExists
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
        if (response?.tasks[0]?.data.length == 1) {
          if (quizLevelData) {
            response.tasks[0].data[0] = {
              ...response.tasks[0].data[0],
              resultCopyInfo: quizLevelData?.actions[0]?.resultCopyInfo?.pass,
            };
          }
          if (isLastDayOfMilestone) {
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
      // order -> quiz, story, simulation
      const order = { 1: 0, 3: 1, 2: 2, 4: 3 };
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
          sectionKey: GOALS_OF_THE_DAY.key,
          key: AI_ACTIONS,
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
      allLearningContent?.forEach(async (obj) => {
        if (obj) {
          const currentQuizId = obj?.quizId?.toString();
          const isQuizCompleted = completedQuizzes.some(
            (quiz) => quiz?.quizId?.toString() == currentQuizId
          );
          if (response?.tasks[0]?.data.length > 0) {
            lockedQuest = true;
          }
          if (!isQuizCompleted && currentDayIds?.includes(currentQuizId)) {
            if (obj.type == 2 || obj.type == 4) {
              actionDetails = {
                actions: obj.type == 2 ? "5 Questions" : "1 Decision",
                time: obj.type == 2 ? "3 min" : "1 min",
              };
              if (!lockedQuest && obj.type == 2) {
                lockedAction = false;
                isSimulationAvailable = true;
              }
              if (!lockedQuest && obj.type == 4 && !isSimulationAvailable) {
                lockedAction = false; // Unlock event
              } else if (obj.type == 4 && isSimulationAvailable) {
                lockedAction = true; // Keep the event locked if simulation is available
              }
              simsAndEvent.push({
                ...obj,
                quizLevelId,
                milestoneId,
                isLocked: lockedAction,
                isLastDayOfMilestone,
                ...actionDetails,
              });
            } else if (obj.type == 1 || obj.type == 3) {
              actionDetails = {
                actions: obj.type == 1 ? "12 Terms" : "28 Slides",
                time: obj.type == 1 ? "1 min" : "3 min",
                rating: obj.type == 1 ? 4.9 : 4.8,
                totalRatings: obj.type == 1 ? "4.6K" : "4.2K",
              };
              learningActions.push({
                ...obj,
                resultCopyInfo: null,
                quizLevelId,
                milestoneId,
                ...actionDetails,
              });
            }
          }
        }
      });
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
        // response?.tasks[0]?.data.length == 1 &&
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
        response.tasks[0].data[0] = {
          ...response.tasks[0].data[0],
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
      if (
        response?.tasks[0]?.title == GOALS_OF_THE_DAY.title &&
        response?.tasks[0]?.data.length > 0
      ) {
        response.isMilestoneHit = false;
      }
      if (
        response?.tasks[0]?.title == GOALS_OF_THE_DAY.title &&
        response?.tasks[0]?.data.length == 0
      ) {
        response?.tasks.shift();
      }
      const aiActions = response.tasks;
      let currentActionNumber =
        aiActions.length >= 1 && aiActions.length <= 5
          ? 6 - aiActions?.length
          : 6;
      const levelsData = [];
      const stageName = currentMilestoneLevels.stageName;
      let currentLevel = 0;
      const defaultCurrentActionInfo = {
        reward: 50,
        type: 6,
        title: "Reward: You’ve earned +50 Tokens!",
        key: "reward",
      };
      currentMilestoneLevels.milestones.forEach((milestone) => {
        milestone.milestoneGoals.forEach((level) => {
          ifCurrentGoalObject =
            milestone?.milestoneId?.toString() ==
              currentMilestoneId?.toString() && level?.day == currentDay;
          ifLevelCompleted = ifCurrentGoalObject ? false : ifLevelCompleted;
          ++currentLevel;
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
              ? aiActions[0] || defaultCurrentActionInfo
              : defaultCurrentActionInfo,
          });
        });
      });
      response.tasks = levelsData;
      response["theme"] = "dark";
      response["colorInfo"] = currentMilestoneLevels.colorInfo;
      return response;
    } catch (error) {
      throw new NetworkError("Error occurred while retrieving milestones", 400);
    }
  }

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
}
export default new MilestoneDBService();
