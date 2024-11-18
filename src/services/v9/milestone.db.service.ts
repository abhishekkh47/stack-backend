import { NetworkError } from "@app/middleware";
import {
  MilestoneTable,
  MilestoneResultTable,
  BusinessProfileTable,
  MilestoneGoalsTable,
  DailyChallengeTable,
  SuggestionScreenCopyTable,
  QuizLevelTable,
  QuizTable,
  QuizResult,
  UserTable,
  MilestoneEventsTable,
  StageTable,
  EmployeeTable,
} from "@app/model";
import {
  getDaysNum,
  mapHasGoalKey,
  hasGoalKey,
  LEARNING_CONTENT,
  ACTIVE_MILESTONE,
  MILESTONE_HOMEPAGE,
  STAGE_COMPLETE,
  DEFAULT_EMPLOYEE,
} from "@app/utility";
import moment from "moment";
import { ObjectId } from "mongodb";
import { EmployeeDBService } from "@services/v9";
class MilestoneDBService {
  /**
   * @description get milestones
   * @returns {*}
   */
  public async getMilestones(userExists) {
    try {
      const [milestones, milestoneResults] = await Promise.all([
        MilestoneTable.find(
          {
            locked: false,
          },
          {
            _id: 1,
            title: "$milestone",
            topicId: 1,
            time: "$description",
            iconImage: "$icon",
            iconBackgroundColor: 1,
          }
        )
          .sort({ order: 1 })
          .lean(),
        MilestoneResultTable.aggregate([
          { $match: { userId: userExists._id } },
          {
            $group: {
              _id: "$milestoneId",
              document: { $first: "$$ROOT" },
            },
          },
          {
            $replaceRoot: { newRoot: "$document" },
          },
        ]).exec(),
      ]);
      const updatedMilestones = milestones.map((goal) => {
        const isCompleted = milestoneResults.some(
          (res) => res.milestoneId.toString() == goal._id.toString()
        );
        return { ...goal, isCompleted };
      });
      return updatedMilestones;
    } catch (err) {
      throw new NetworkError("Error occurred while retrieving milestones", 400);
    }
  }

  /**
   * @description get milestones goals based on milestoneId
   * @param milestoneId
   * @returns {*}
   */
  public async getMilestoneGoals(milestoneId: any) {
    const [milestoneData, milestoneGoals] = await Promise.all([
      MilestoneTable.findOne({ _id: milestoneId }),
      MilestoneGoalsTable.find({ milestoneId })
        .sort({ day: 1, order: 1 })
        .lean(),
    ]);
    const aggregatedGoals = milestoneGoals.reduce((acc, current) => {
      let dayGroup = acc.find((group) => group.day === current.day);

      if (!dayGroup) {
        dayGroup = {
          day: current.day,
          title: `Day ${current.day}`,
          data: [],
        };
        acc.push(dayGroup);
      }
      const { createdAt, updatedAt, ...goalData } = current;
      dayGroup.data.push(goalData);

      return acc;
    }, []);
    aggregatedGoals.sort((a, b) => a.day - b.day);

    return {
      title: milestoneData.milestone,
      data: aggregatedGoals,
    };
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
        simsAndEvent = [];
      const { GOALS_OF_THE_DAY, IS_COMPLETED, COMPLETED_GOALS, EARN } =
        MILESTONE_HOMEPAGE;
      if (advanceNextDay && userIfExists.isPremiumUser) {
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
      const [
        lastMilestoneCompleted,
        availableDailyChallenges,
        userHiredEmployees,
      ] = await Promise.all([
        MilestoneResultTable.findOne({
          userId: userIfExists._id,
        })
          .sort({ createdAt: -1 })
          .lean(),
        DailyChallengeTable.findOne({ userId: userIfExists._id }).lean(),
        EmployeeDBService.listHiredEmployees(userIfExists),
      ]);
      let completedActions = Object.keys(
        businessProfile?.completedActions || []
      );
      if (businessProfile.description) {
        completedActions = ["ideaValidation", ...completedActions];
      }
      const [
        existingResponse,
        existingResponseWithPendingActions,
        completedActionsResponse,
        milestoneData,
        stageData,
      ] = await Promise.all([
        this.handleAvailableDailyChallenges(
          userIfExists,
          businessProfile,
          availableDailyChallenges,
          lastMilestoneCompleted
        ),
        this.handleAvailableDailyChallenges(
          userIfExists,
          businessProfile,
          availableDailyChallenges,
          lastMilestoneCompleted,
          true
        ),
        this.getActionDetails(
          userIfExists,
          completedActions,
          currentMilestoneId,
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
        response = await this.getFirstDayMilestoneGoals(userIfExists);
      } else if (
        getDaysNum(userIfExists, availableDailyChallenges["updatedAt"]) >= 1 ||
        currentMilestoneId.toString() !=
          lastMilestoneCompleted.milestoneId.toString()
      ) {
        response = await this.getNextDayMilestoneGoals(
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
        response = await this.getNextDayMilestoneGoals(
          userIfExists,
          businessProfile,
          lastMilestoneCompleted,
          existingResponseWithPendingActions,
          availableDailyChallenges
        );
      }
      if (completedActionsResponse?.length) {
        response?.tasks?.push({
          title: COMPLETED_GOALS.title,
          data: completedActionsResponse,
          sectionKey: COMPLETED_GOALS.key,
        });
      } else if (
        completedActionsResponse?.length &&
        response?.tasks?.length > 1
      ) {
        response.tasks[1].data = completedActionsResponse;
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
        const currentMilestoneId = response?.tasks[0]?.data[0].milestoneId;
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
      }

      if (
        (currentMilestoneId &&
          response?.tasks[0]?.title != GOALS_OF_THE_DAY.title) ||
        (response?.tasks[0]?.title == GOALS_OF_THE_DAY.title &&
          response?.tasks[0]?.data?.length == 0)
      ) {
        response.isMilestoneHit = await this.checkIfMilestoneHit(
          lastMilestoneCompleted,
          currentMilestoneId
        );
      } else {
        response.isMilestoneHit = false;
      }
      // order -> quiz, story, simulation
      const order = { 1: 0, 3: 1, 2: 2, 4: 3 };
      const learningContent = await this.getLearningContent(
        userIfExists,
        currentGoal
      );
      const quizLevelId = learningContent?.quizLevelId || null;
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
                isLocked: lockedAction,
                isLastDayOfMilestone,
              });
            } else if (obj.type == 1 || obj.type == 3) {
              learningActions.push({
                ...obj,
                resultCopyInfo: null,
                quizLevelId,
              });
            }
          }
        }
      });
      if (simsAndEvent.length > 0) {
        const updatedSimsAndEvent = simsAndEvent.sort(
          (a, b) => order[a?.type] - order[b?.type]
        );
        if (
          response?.tasks[0] &&
          response?.tasks[0]?.title == GOALS_OF_THE_DAY.title
        ) {
          response.tasks[0].data = [
            ...response?.tasks[0]?.data,
            ...updatedSimsAndEvent,
          ];
        } else {
          response?.tasks?.unshift({
            title: GOALS_OF_THE_DAY.title,
            data: updatedSimsAndEvent,
            sectionKey: GOALS_OF_THE_DAY.key,
          });
        }
      }
      if (learningActions.length || userHiredEmployees.length) {
        let dataArr = [];
        if (userHiredEmployees.length) {
          dataArr = [...dataArr, ...userHiredEmployees];
        }
        if (learningActions.length) {
          dataArr = [...dataArr, ...learningActions];
        }
        if (response?.tasks.length > 1) {
          response?.tasks.splice(1, 0, {
            title: EARN.title,
            data: dataArr,
            sectionKey: EARN.key,
          });
        } else {
          response?.tasks?.push({
            title: EARN.title,
            data: dataArr,
            sectionKey: EARN.key,
          });
        }
      }
      const completedLearnings = learningContent?.completedQuizIds
        ?.map((id) => {
          const learning = allLearningContent?.find(
            (obj) => obj.quizId.toString() == id.toString()
          );
          if (learning) {
            return { ...learning, [IS_COMPLETED]: true };
          }
          return null;
        })
        .filter(Boolean);
      if (completedLearnings.length) {
        if (response?.tasks[1]) {
          response.tasks[1].data = [
            ...completedLearnings,
            ...response.tasks[1].data,
          ];
        } else {
          response.tasks.push({
            title: COMPLETED_GOALS.title,
            data: completedLearnings,
            sectionKey: COMPLETED_GOALS.key,
          });
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
      if (
        currentMilestoneDetails?.stageId?.toString() !=
          nextMilestoneDetails?.stageId?.toString() &&
        response?.tasks[0]?.data.length == 1 &&
        isLastDayOfMilestone
      ) {
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
        };
      }
      if (
        response?.tasks[0]?.title == GOALS_OF_THE_DAY.title &&
        response?.tasks[0]?.data.length > 0
      ) {
        response.isMilestoneHit = false;
      }
      return response;
    } catch (error) {
      throw new NetworkError("Error occurred while retrieving milestones", 400);
    }
  }

  /**
   * @description get current goals
   * @param businessProfile
   * @param milestones goals array of current milestone
   * @param isMilestoneHit if all goals of current milestone are hit or not
   * @param daysInCurrentMilestone total number of days in current milestone
   * @returns {*}
   */
  private formatMilestones(
    businessProfile: any,
    milestones: any,
    isMilestoneHit: boolean = false,
    daysInCurrentMilestone: number = 0
  ) {
    try {
      const { IS_COMPLETED, GOALS_OF_THE_DAY, COMPLETED_GOALS } =
        MILESTONE_HOMEPAGE;
      let response = {
        isMilestoneHit,
        tasks: [
          {
            title: GOALS_OF_THE_DAY.title,
            data: [],
            sectionKey: GOALS_OF_THE_DAY.key,
          },
          {
            title: COMPLETED_GOALS.title,
            data: [],
            sectionKey: COMPLETED_GOALS.key,
          },
        ],
      };
      milestones.forEach((milestone) => {
        if (
          milestone.key == "ideaValidation" ||
          milestone.key == "description"
        ) {
          if (businessProfile?.description) {
            milestone[IS_COMPLETED] = true;
            response.tasks[1].data.push(milestone);
          } else {
            milestone[IS_COMPLETED] = false;
            response.tasks[0].data.push(milestone);
          }
        } else if (businessProfile) {
          const hasGoalInProfile = hasGoalKey(businessProfile, milestone.key);
          const hasGoalInCompletedActions = mapHasGoalKey(
            businessProfile.completedActions,
            milestone.key
          );
          if (hasGoalInProfile || hasGoalInCompletedActions) {
            milestone[IS_COMPLETED] = true;
            response.tasks[1].data.push(milestone);
          } else {
            milestone[IS_COMPLETED] = false;
            response.tasks[0].data.push(milestone);
          }
        } else {
          milestone[IS_COMPLETED] = false;
          response.tasks[0].data.push(milestone);
        }
      });
      if (!response?.tasks[0]?.data?.length) {
        isMilestoneHit = response?.tasks[1]?.data.some(
          (obj) => obj.day == daysInCurrentMilestone
        );
        response.isMilestoneHit = isMilestoneHit;
        if (isMilestoneHit) {
          response.tasks.shift();
        }
      } else if (!response?.tasks[1]?.data.length) {
        response.tasks.pop();
      }

      return response;
    } catch (error) {
      throw new NetworkError(
        "Error occurred while retrieving new Milestone",
        400
      );
    }
  }

  /**
   * @description get day-1 goals of defualt milestone
   * @param userIfExists
   * @returns {*}
   */
  public async getFirstDayMilestoneGoals(userIfExists) {
    try {
      const initialMilestone = (
        await MilestoneTable.findOne({
          order: 1,
        })
      )._id;
      const currentDate = new Date().toISOString();
      const updateObj = {
        currentMilestone: {
          milestoneId: initialMilestone._id,
          milestoneUpdatedAt: currentDate,
        },
      };
      const [businessProfile, initialGoals] = await Promise.all([
        BusinessProfileTable.findOneAndUpdate(
          { userId: userIfExists._id },
          { $set: updateObj },
          { new: true, upsert: true }
        ),
        MilestoneGoalsTable.find({
          milestoneId: initialMilestone._id,
          day: 1,
          key: { $ne: "ideaValidation" },
        })
          .sort({ order: 1 })
          .lean(),
      ]);
      const goalsData = await this.suggestionScreenInfo(initialGoals);

      const updatedGoals = this.setLockedGoals(goalsData, businessProfile);
      await DailyChallengeTable.updateOne(
        { userId: userIfExists._id },
        { $set: { userId: userIfExists._id, dailyGoalStatus: updatedGoals } },
        { upsert: true }
      );
      return this.formatMilestones(businessProfile, updatedGoals);
    } catch (error) {
      throw new NetworkError(
        "Error occurred while retrieving new Milestone",
        400
      );
    }
  }

  /**
   * @description this method will fetch the next available milestone goals
   * @param userIfExists
   * @param businessProfile
   * @returns {*}
   */
  private async getNextDayMilestoneGoals(
    userIfExists: any,
    businessProfile: any,
    lastMilestoneCompleted: any,
    existingResponseWithPendingActions: any,
    availableDailyChallengesIfExists: any
  ) {
    try {
      const isMilestoneHit = existingResponseWithPendingActions?.isMilestoneHit;
      const { milestoneId } = businessProfile.currentMilestone;
      const daysInCurrentMilestone = (
        await MilestoneGoalsTable.find({
          milestoneId,
        })
          .sort({ day: -1 })
          .lean()
      )[0].day;
      let prevDayNum =
        lastMilestoneCompleted.milestoneId.toString() === milestoneId.toString()
          ? lastMilestoneCompleted.day
          : 0;
      if (prevDayNum + 1 > daysInCurrentMilestone && isMilestoneHit) {
        return existingResponseWithPendingActions;
      }
      const dayToFetch = Math.min(prevDayNum + 1, daysInCurrentMilestone);
      const currentMilestoneGoals = await MilestoneGoalsTable.find({
        milestoneId,
        day: dayToFetch,
      })
        .sort({ day: 1, order: 1 })
        .lean();

      const availableChallengesMap = new Map(
        availableDailyChallengesIfExists?.dailyGoalStatus.map((goal) => [
          goal.key,
          goal,
        ]) ?? []
      );
      if (availableChallengesMap.has(currentMilestoneGoals[0]?.key)) {
        return await this.handleAvailableDailyChallenges(
          userIfExists,
          businessProfile,
          availableDailyChallengesIfExists,
          lastMilestoneCompleted,
          true
        );
      }

      const goalsData = await this.suggestionScreenInfo(currentMilestoneGoals);
      const updatedGoals = this.setLockedGoals(goalsData, businessProfile);
      await DailyChallengeTable.updateOne(
        { userId: userIfExists._id },
        {
          $push: {
            dailyGoalStatus: { $each: updatedGoals },
          },
        },
        { upsert: true }
      );
      const availableDailyChallenges = await DailyChallengeTable.findOne({
        userId: userIfExists._id,
      }).lean();
      return await this.handleAvailableDailyChallenges(
        userIfExists,
        businessProfile,
        availableDailyChallenges,
        lastMilestoneCompleted,
        true
      );
    } catch (error) {
      throw new NetworkError(
        "Error occurred while retrieving new Milestone",
        400
      );
    }
  }

  /**
   * @description this method will set the isLocked status for each goal based on their dependency
   * @param goals array of milestone goals
   * @param businessProfile
   * @returns {*}
   */
  private setLockedGoals(goals: any, businessProfile: any) {
    return goals?.map((goal) => {
      const isLocked =
        !goal?.dependency || (goal?.dependency && !goal?.dependency.length)
          ? false
          : !goal?.dependency?.every((dependencyKey) => {
              const hasGoalInProfile = hasGoalKey(
                businessProfile,
                dependencyKey
              );
              const hasGoalInCompletedActions = mapHasGoalKey(
                businessProfile.completedActions,
                dependencyKey
              );
              if (hasGoalInProfile || hasGoalInCompletedActions) {
                return true;
              }
            });
      return {
        ...goal,
        isLocked, // add isLocked key to the object
      };
    });
  }

  /**
   * @description this method will return the user input prompt corresponding to the AI Tool being used
   * @param userIfExists
   * @param goalId
   * @returns {*}
   */
  public async saveMilestoneGoalResults(userIfExists: any, key: string) {
    try {
      const goal = await MilestoneGoalsTable.findOne({ key }).lean();
      const resultObj = {
        userId: userIfExists._id,
        milestoneId: goal.milestoneId,
        day: goal.day,
        order: goal.order,
        goalId: goal._id,
        key: goal.key,
      };
      await MilestoneResultTable.create(resultObj);
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }

  /**
   * @description this method will add suggestionScreenInfo object to each goal of current milestone
   * @param initialGoals
   * @returns {*}
   */
  public async suggestionScreenInfo(initialGoals: any) {
    try {
      const keys = initialGoals.map((obj) => obj.key);
      const suggestionScreenCopy = await this.keyBasedSuggestionScreenInfo(
        keys
      );
      const updatedGoals = initialGoals.map((goal) => {
        const copyData = suggestionScreenCopy[goal.key];
        goal["name"] = copyData.name;
        if (goal.inputTemplate) {
          goal.inputTemplate["suggestionScreenInfo"] = copyData;
          return goal;
        } else {
          goal["inputTemplate"] = {};
          goal.inputTemplate["suggestionScreenInfo"] = copyData;
          return goal;
        }
      });
      return updatedGoals;
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }

  /**
   * @description this function returns the currently saved challenges in DB if available
   * @param userIfExists
   * @param businessProfile
   * @param availableDailyChallenges current daily challenges in db
   * @returns {*}
   */
  private async handleAvailableDailyChallenges(
    userIfExists: any,
    businessProfile: any,
    availableDailyChallenges: any,
    lastMilestoneCompleted: any,
    override: boolean = false
  ) {
    const suggestionScreenCopy = await SuggestionScreenCopyTable.find(
      {}
    ).lean();
    try {
      let isMilestoneHit = false,
        isIdeaValidationGoalAvailable = false;
      const currentMilestoneId = businessProfile.currentMilestone?.milestoneId;
      const goalsLength = availableDailyChallenges?.dailyGoalStatus?.length;
      let ideaValidationGoal = await this.getActionDetails(
        userIfExists,
        ["ideaValidation"],
        currentMilestoneId
      );
      if (
        goalsLength &&
        (getDaysNum(userIfExists, availableDailyChallenges["updatedAt"]) < 1 ||
          override) &&
        currentMilestoneId?.toString() ==
          availableDailyChallenges?.dailyGoalStatus[
            goalsLength - 1
          ].milestoneId.toString()
      ) {
        const updatedGoals = this.setLockedGoals(
          availableDailyChallenges.dailyGoalStatus,
          businessProfile
        );
        let response = {
          isMilestoneHit: false,
          tasks: [
            {
              title: MILESTONE_HOMEPAGE.GOALS_OF_THE_DAY.title,
              data: [],
              sectionKey: MILESTONE_HOMEPAGE.GOALS_OF_THE_DAY.key,
            },
          ],
        };

        updatedGoals.forEach((goal) => {
          const copyData = suggestionScreenCopy.find(
            (obj) => obj.key == goal.key
          );
          goal.inputTemplate.suggestionScreenInfo = copyData;
          goal["iconImage"] = copyData.iconImage;
          goal["iconBackgroundColor"] = copyData.iconBackgroundColor;
        });

        updatedGoals.forEach((goal) => {
          if (goal.key == "ideaValidation" || goal.key == "description") {
            isIdeaValidationGoalAvailable = true;
            if (!businessProfile?.description) {
              goal[MILESTONE_HOMEPAGE.IS_COMPLETED] = false;
              response.tasks[0].data.push(goal);
            }
          } else if (businessProfile) {
            const hasGoalInProfile = hasGoalKey(businessProfile, goal.key);
            const hasGoalInCompletedActions = mapHasGoalKey(
              businessProfile.completedActions,
              goal.key
            );
            if (!(hasGoalInProfile || hasGoalInCompletedActions)) {
              goal[MILESTONE_HOMEPAGE.IS_COMPLETED] = false;
              response.tasks[0].data.push(goal);
            }
          }
          if (
            !isIdeaValidationGoalAvailable &&
            goal.key == "companyName" &&
            !businessProfile?.description
          ) {
            ideaValidationGoal[0]["isCompleted"] = false;
            response?.tasks[0]?.data.unshift(ideaValidationGoal[0]);
          }
        });
        if (!response?.tasks[0]?.data?.length) {
          isMilestoneHit = await this.checkIfMilestoneHit(
            lastMilestoneCompleted,
            currentMilestoneId
          );
          response.isMilestoneHit = isMilestoneHit;
          if (isMilestoneHit) {
            response.tasks.shift();
          }
        }
        return response;
      }
      return null;
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }

  /**
   * @description this method will fetch the required learning content
   * @param userIfExists
   * @param actionObj Ai action details of current active milestone
   * @returns {*}
   */
  private async getLearningContent(userIfExists: any, actionObj: any) {
    try {
      const startOfDay = moment().startOf("day").toDate(); // 12:00 AM today
      const endOfDay = moment().endOf("day").toDate(); // 11:59:59 PM today
      let quizLevelId = null;
      let learningActions = null,
        quizCompletedToday = null,
        completedQuizIds = null;
      const allLearnings = { all: [], currentDayGoal: [] };
      if (actionObj?.milestoneId) {
        [learningActions, quizCompletedToday] = await Promise.all([
          QuizLevelTable.find(
            {
              milestoneId: actionObj?.milestoneId,
              day: { $lte: actionObj?.day },
            },
            { actions: 1, day: 1 }
          ).lean(),
          QuizResult.find({
            userId: userIfExists._id,
            updatedAt: {
              $gte: startOfDay,
              $lt: endOfDay,
            },
          }).sort({ createdAt: 1 }),
        ]);

        completedQuizIds = quizCompletedToday?.map((obj) =>
          obj.quizId.toString()
        );
        learningActions.forEach((obj) => {
          allLearnings.all.push(...obj.actions);
          if (obj.day == actionObj?.day) {
            quizLevelId = obj._id;
            allLearnings.currentDayGoal.push(...obj.actions);
          }
        });
      }
      if (!learningActions) return null;
      const challengeDetails = await this.getQuizDetails(allLearnings.all);
      return {
        all: challengeDetails,
        currentDayGoal: allLearnings.currentDayGoal,
        completedQuizIds,
        quizLevelId,
      };
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }

  /**
   * @description get formatted quiz content
   * @param actions array of learning content
   * @returns {*}
   */
  private async getQuizDetails(actions: any) {
    try {
      let quizDetails = null,
        time = null;
      const updatedActions = await Promise.all(
        actions.map(async (action) => {
          let iconImage = LEARNING_CONTENT.learn.icon,
            iconBackgroundColor = LEARNING_CONTENT.learn.iconBGColor;
          const actionType = action.type;
          if (actionType == 4) {
            quizDetails = await this.getEventDetails(action);
          } else {
            quizDetails = await QuizTable.findOne({ _id: action?.quizId });
          }
          if (actionType == 1) {
            time = `Earn ${action?.reward} tokens - 1 min`;
          } else if (actionType == 3) {
            time = `Earn ${action?.reward} tokens - 3 min`;
          } else {
            time = `AI-Assisted - 2 min`;
            iconImage = LEARNING_CONTENT.quest.icon;
            iconBackgroundColor = LEARNING_CONTENT.quest.iconBGColor;
          }
          if (quizDetails && actionType == 4) {
            return quizDetails;
          } else if (quizDetails) {
            return {
              ...action,
              title: quizDetails?.quizName,
              iconBackgroundColor: iconBackgroundColor,
              iconImage: iconImage,
              characterName: quizDetails?.characterName,
              characterImage: quizDetails?.characterImage,
              time,
              key: MILESTONE_HOMEPAGE.CHALLENGES,
            };
          }
        })
      );
      return updatedActions;
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }

  /**
   * @description get AI action details and related screen copy
   * @param userIfExists
   * @param keys array of action identifiers
   * @param currentMilestoneId current milestone id
   * @returns {*}
   */
  public async getActionDetails(
    userIfExists: any,
    keys: string[],
    currentMilestoneId: any,
    filterCurrentDay: boolean = false
  ) {
    try {
      let filteredGoals = null;
      const startOfDay = moment().startOf("day").toDate(); // 12:00 AM today
      const endOfDay = moment().endOf("day").toDate(); // 11:59:59 PM today

      const [goalDetails, inputTemplate, recordsUpdatedToday] =
        await Promise.all([
          MilestoneGoalsTable.find(
            { key: { $in: keys }, milestoneId: currentMilestoneId },
            { id: 0, dependency: 0, categoryId: 0, createdAt: 0, updatedAt: 0 }
          ).lean(),
          this.keyBasedSuggestionScreenInfo(keys),
          // get goals completed today only
          MilestoneResultTable.find({
            userId: userIfExists._id,
            milestoneId: currentMilestoneId,
            updatedAt: {
              $gte: startOfDay,
              $lt: endOfDay,
            },
          }),
        ]);
      const currentDayCompletedKeys = recordsUpdatedToday.map((obj) => obj.key);
      if (filterCurrentDay) {
        filteredGoals = goalDetails.filter((goal) =>
          currentDayCompletedKeys.includes(goal.key)
        );
      } else {
        filteredGoals = goalDetails;
      }
      filteredGoals.forEach((goal) => {
        goal["inputTemplate"]["suggestionScreenInfo"] = inputTemplate[goal.key];
        goal[MILESTONE_HOMEPAGE.IS_COMPLETED] = true;
        goal["isLocked"] = false;
        goal.iconImage = inputTemplate[goal.key].iconImage;
        goal.iconBackgroundColor = inputTemplate[goal.key].iconBackgroundColor;
      });
      filteredGoals.sort((a, b) => {
        if (a.day == b.day) {
          return a.order - b.order;
        } else {
          return a.day - b.day;
        }
      });
      return filteredGoals;
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }

  /**
   * @description this method will add suggestionScreenInfo object to each goal of current milestone
   * @param keys array of action identifiers
   * @returns {*}
   */
  public async keyBasedSuggestionScreenInfo(keys: any) {
    try {
      const suggestionScreenCopy = await SuggestionScreenCopyTable.find(
        {},
        { createdAt: 0, updatedAt: 0 }
      ).lean();
      const suggestionScreenCopyMap = new Map(
        suggestionScreenCopy.map((obj) => [obj.key, obj])
      );
      const updatedGoals = keys?.reduce((acc, key) => {
        const copyData = suggestionScreenCopyMap.get(key);
        if (copyData) {
          acc[copyData.key] = copyData;
        }
        return acc;
      }, {});
      return updatedGoals;
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }

  /**
   * @description this method will remove the completed action from the current goals list
   * @param userIfExists
   * @param key
   * @returns {*}
   */
  public async removeCompletedAction(userIfExists: any, key: any) {
    try {
      await DailyChallengeTable.updateOne(
        { userId: userIfExists._id },
        { $pull: { dailyGoalStatus: { key } } }
      );
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }

  /**
   * @description set default milestone while user signup
   * @param userIfExists
   * @returns {*}
   */
  public async setDefaultMilestoneToBusinessProfile(userIfExists) {
    try {
      const initialMilestone = (
        await MilestoneTable.findOne({
          order: 1,
        })
      )._id;
      const currentDate = new Date().toISOString();
      const updateObj = {
        currentMilestone: {
          milestoneId: initialMilestone._id,
          milestoneUpdatedAt: currentDate,
        },
      };
      await BusinessProfileTable.findOneAndUpdate(
        { userId: userIfExists._id },
        { $set: updateObj },
        { new: true, upsert: true }
      );
    } catch (error) {
      throw new NetworkError(
        "Error occurred while retrieving new Milestone",
        400
      );
    }
  }

  /**
   * @description get current milestone progress
   * @param businessProfile
   * @param milestoneId
   * @returns {*}
   */
  public async getMilestoneProgress(
    businessProfile: any,
    milestoneId: any = null
  ) {
    try {
      const userId = businessProfile.userId;
      let dailyGoal = null,
        progress = 0;
      let currentMilestoneId = businessProfile.currentMilestone?.milestoneId;
      if (milestoneId) {
        currentMilestoneId = milestoneId;
      }
      if (!currentMilestoneId) {
        currentMilestoneId = await MilestoneTable.findOne({ order: 1 });
      }
      const [
        currentMilestone,
        milestoneGoals,
        lastGoalCompleted,
        currentGoals,
      ] = await Promise.all([
        MilestoneTable.findOne({ _id: currentMilestoneId }),
        MilestoneGoalsTable.find({ milestoneId: currentMilestoneId }).sort({
          day: 1,
        }),
        MilestoneResultTable.findOne({
          userId,
          milestoneId: currentMilestoneId,
        }).sort({
          createdAt: -1,
        }),
        DailyChallengeTable.findOne({ userId }),
      ]);

      let currentGoalKey = null;
      const dailyGoalStatus = currentGoals?.dailyGoalStatus || [];
      if (dailyGoalStatus?.length > 0) {
        currentGoalKey = dailyGoalStatus[dailyGoalStatus.length - 1].key;
      } else {
        currentGoalKey = lastGoalCompleted?.key;
      }
      if (!currentGoalKey && currentMilestoneId) {
        dailyGoal = await MilestoneGoalsTable.findOne({
          milestoneId: currentMilestoneId,
          day: 1,
        });
      } else {
        dailyGoal = await MilestoneGoalsTable.findOne({
          key: currentGoalKey,
        });
      }

      const totalGoals = milestoneGoals?.length;
      const totalDays = milestoneGoals[totalGoals - 1]?.day || 1;
      const currentDay = lastGoalCompleted?.day || 1;
      const currentDayMilestoneGoals = await MilestoneGoalsTable.find({
        milestoneId: currentMilestoneId,
        day: currentDay,
      });
      const totalCurrentDayGoals = currentDayMilestoneGoals?.length;
      let currentGoalCompletedChallenges = 0;
      currentDayMilestoneGoals.map((obj) => {
        if (
          (obj.key == "ideaValidation" && businessProfile.description) ||
          businessProfile.completedActions[obj.key]
        ) {
          currentGoalCompletedChallenges += 1;
        }
      });
      progress =
        (100 / totalDays) * (currentDay - 1) +
        (100 / totalDays / totalCurrentDayGoals) *
          currentGoalCompletedChallenges;
      return {
        _id: currentMilestoneId,
        title: currentMilestone.milestone,
        iconImage: currentMilestone.icon,
        iconBackgroundColor: currentMilestone.iconBackgroundColor,
        progress,
        time: `${dailyGoal.dayTitle} - Day ${currentDay}/${totalDays}`,
        key: ACTIVE_MILESTONE,
      };
    } catch (error) {
      throw new NetworkError(
        "Error occurred while retrieving new Milestone",
        400
      );
    }
  }

  /**
   * @description Check if the current milestone is completed
   * @param lastMilestoneCompleted
   * @param currentMilestoneId
   * @returns {*}
   */
  private async checkIfMilestoneHit(
    lastMilestoneCompleted: any,
    currentMilestoneId: any
  ) {
    const currentMilestone = await MilestoneGoalsTable.findOne({
      milestoneId: currentMilestoneId,
    })
      .sort({ day: -1 })
      .lean();
    const daysInCurrentMilestone = currentMilestone.day;
    const isMilestoneHit = lastMilestoneCompleted.day == daysInCurrentMilestone;
    return isMilestoneHit;
  }

  /**
   * @description get completed milestones list
   * @param userExists
   * @returns {*}
   */
  public async getCompletedMilestones(userExists) {
    try {
      const [milestoneList, milestoneGoalsCount] = await Promise.all([
        this.getMilestones(userExists),
        MilestoneGoalsTable.aggregate([
          {
            $group: {
              _id: "$milestoneId",
              count: { $sum: 1 },
            },
          },
          {
            $sort: { count: -1 },
          },
        ]),
      ]);
      const completedMilestone = milestoneList?.filter(
        (obj) => obj.isCompleted == true
      );
      const milestoneGoalsCountMap = new Map(
        milestoneGoalsCount.map((obj) => [obj._id.toString(), obj])
      );

      completedMilestone?.map((obj) => {
        const ifCompleted = milestoneGoalsCountMap.get(obj._id.toString());
        if (ifCompleted) {
          obj["time"] = `${ifCompleted.count} Goals Completed`;
          obj["key"] = MILESTONE_HOMEPAGE.COMPLETED_MILESTONE;
          obj["progress"] = 100;
          obj[MILESTONE_HOMEPAGE.IS_COMPLETED] = false;
          return obj;
        }
      });

      return completedMilestone;
    } catch (error) {
      throw new NetworkError(
        "Error occurred while retrieving new Milestone",
        400
      );
    }
  }

  /**
   * @description get milestone homepage content
   * @param userExists
   * @param businessProfile
   * @param advanceNextDay if current day goals are completed and want to move to next day
   * @returns {*}
   */
  public async getUserMilestoneGoals(
    userExists: any,
    businessProfile: any,
    advanceNextDay: boolean = false
  ) {
    try {
      const currentMilestone = businessProfile.currentMilestone.milestoneId;
      const {
        CURRENT_MILESTONE,
        COMPLETED_MILESTONES,
        GOALS_OF_THE_DAY,
        SHOW_PRO_BANNER,
      } = MILESTONE_HOMEPAGE;
      let updatedCompletedMilestones = null;
      const [goals, milestoneProgress, completedMilestones] = await Promise.all(
        [
          this.getCurrentMilestoneGoals(
            userExists,
            businessProfile,
            advanceNextDay
          ),
          this.getMilestoneProgress(businessProfile),
          this.getCompletedMilestones(userExists),
        ]
      );
      goals?.tasks?.unshift({
        title: CURRENT_MILESTONE.title,
        data: [milestoneProgress],
        sectionKey: CURRENT_MILESTONE.key,
      });
      if (!goals.isMilestoneHit) {
        updatedCompletedMilestones = completedMilestones?.filter(
          (obj) => currentMilestone?.toString() != obj?._id?.toString()
        );
      } else {
        updatedCompletedMilestones = completedMilestones;
      }
      if (updatedCompletedMilestones?.length > 0) {
        goals?.tasks?.push({
          title: COMPLETED_MILESTONES.title,
          data: updatedCompletedMilestones,
          sectionKey: COMPLETED_MILESTONES.key,
        });
      }
      const todaysGoalIdx = goals.tasks.findIndex(
        (obj) => obj.title == GOALS_OF_THE_DAY.title
      );
      const curentMilestoneIdx = goals.tasks.findIndex(
        (obj) => obj.title == CURRENT_MILESTONE.title
      );
      const completedMilestoneIdx = goals.tasks.findIndex(
        (obj) => obj.title == COMPLETED_MILESTONES.title
      );
      if (
        goals.isMilestoneHit &&
        (todaysGoalIdx < 0 ||
          (todaysGoalIdx >= 0 && goals.tasks[todaysGoalIdx]?.data?.length == 0))
      ) {
        goals.tasks = [goals.tasks[completedMilestoneIdx]];
        return goals;
      }
      if (todaysGoalIdx > -1) {
        if (goals?.tasks[todaysGoalIdx]?.data?.length > 0) {
          goals.tasks[todaysGoalIdx][SHOW_PRO_BANNER] = true;
        } else {
          goals.tasks[curentMilestoneIdx][SHOW_PRO_BANNER] = true;
        }
        if (
          !userExists.isPremiumUser &&
          goals?.tasks[todaysGoalIdx]?.data?.length < 0
        ) {
          goals.tasks.splice(todaysGoalIdx, 1);
        }
      } else if (curentMilestoneIdx > -1) {
        goals.tasks[curentMilestoneIdx][SHOW_PRO_BANNER] = true;
      }

      const currentDayGoals = this.getGoalOfTheDay(userExists);
      return { ...goals, ...currentDayGoals };
    } catch (error) {
      throw new NetworkError(
        "Error occurred while retrieving new Milestone",
        400
      );
    }
  }

  /**
   * @description get milestone summary
   * @param businessProfile
   * @param milestoneId milestonId to get summary for
   * @returns {*}
   */
  public async getMilestoneSummary(businessProfile: any, milestoneId: any) {
    try {
      const summaryData = [],
        summaryObj = {};
      let actionValue = null;
      const {
        completedActions,
        idea = null,
        description = null,
      } = businessProfile;
      const [milestoneGoals, milestoneProgress] = await Promise.all([
        MilestoneGoalsTable.find(
          { milestoneId },
          {
            day: 1,
            dayTitle: 1,
            title: 1,
            order: 1,
            key: 1,
            template: 1,
            inputTemplate: 1,
          }
        ).sort({ day: 1, order: 1 }),
        this.getMilestoneProgress(businessProfile, milestoneId),
      ]);

      const requiredKeys = milestoneGoals.map((obj) => obj.key);
      const suggestionsScreenCopy = await this.keyBasedSuggestionScreenInfo(
        requiredKeys
      );
      milestoneGoals.map((goal) => {
        actionValue = completedActions[goal.key];
        if (goal.key == "ideaValidation" && idea && description) {
          actionValue = {
            title: idea,
            description,
          };
        }
        if (actionValue) {
          const goalObj = {
            title: goal.title,
            data: actionValue,
            actionKey: goal.key,
            template: goal.template,
            inputTemplate: {
              ["suggestionScreenInfo"]: suggestionsScreenCopy[goal.key] || {},
            },
          };
          if (summaryObj[goal.dayTitle]) {
            summaryObj[goal.dayTitle].push(goalObj);
          } else {
            summaryObj[goal.dayTitle] = [goalObj];
          }
        }
      });
      for (const [key, value] of Object.entries(summaryObj)) {
        summaryData.push({
          title: key,
          data: value,
        });
      }

      return { ...milestoneProgress, summaryData };
    } catch (error) {
      throw new NetworkError(
        "Error occurred while retrieving new Milestone",
        400
      );
    }
  }

  /**
   * @description Update rewards collected today
   * @param userIfExists
   * @param coins tokens collected on completed a challenge or quiz
   * @param cash cash collected on completed a challenge or quiz
   * @param ifLastGoalOfDay whether its the last ai action completed for the day
   * @returns {*}
   */
  public async updateTodaysRewards(
    userIfExists: any,
    coins: number = 0,
    cash: number = 0,
    ifLastGoalOfDay: boolean = false
  ) {
    try {
      const rewardsUpdatedOn = userIfExists?.currentDayRewards?.updatedAt;
      const days = getDaysNum(userIfExists, rewardsUpdatedOn) || 0;
      const totalCoins = coins + (ifLastGoalOfDay ? 5 : 0);
      let updateObj = {};
      if (days < 1) {
        updateObj = {
          $inc: {
            "currentDayRewards.quizCoins": totalCoins,
            "currentDayRewards.goals": 1,
            "currentDayRewards.cash": cash,
          },
          $set: {
            "currentDayRewards.streak": 1,
            "currentDayRewards.updatedAt": new Date(),
          },
        };
      } else {
        updateObj = {
          $set: {
            "currentDayRewards.streak": 1,
            "currentDayRewards.quizCoins": totalCoins,
            "currentDayRewards.goals": 1,
            "currentDayRewards.cash": cash,
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
   * @description Update rewards collected today
   * @param userIfExists
   * @returns {*}
   */
  private getGoalOfTheDay(userIfExists: any) {
    try {
      const currentDayRewards = userIfExists?.currentDayRewards;
      if (currentDayRewards) {
        const { streak, quizCoins, goals, cash, updatedAt } = currentDayRewards;
        const days = getDaysNum(userIfExists, updatedAt);
        if (days < 1) {
          return {
            streakProgress: streak || 0,
            fuelProgress: quizCoins || 0,
            goalProgress: goals || 0,
            cashProgress: cash || 0,
          };
        }
      }
      return {
        streakProgress: 0,
        fuelProgress: 0,
        goalProgress: 0,
        cashProgress: 0,
      };
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }

  /**
   * @description get milestone roadmap
   * @param milestoneId milestonId to get summary for
   * @returns {*}
   */
  public async getMilestoneRoadmap(milestoneId: any) {
    try {
      let roadMap = [];
      const [firstMilestone, selectedMilestone] = await Promise.all([
        MilestoneTable.aggregate([
          { $match: { order: 1 } },
          {
            $lookup: {
              from: "milestone_goals",
              localField: "_id",
              foreignField: "milestoneId",
              as: "milestoneGoals",
            },
          },
          {
            $project: {
              _id: 0,
              milestoneId: "$_id",
              milestone: 1,
              milestoneGoals: {
                $map: {
                  input: "$milestoneGoals",
                  as: "goal",
                  in: {
                    title: "$$goal.title",
                    day: "$$goal.day",
                    order: "$$goal.order",
                    dayTitle: "$$goal.dayTitle",
                    icon: "$$goal.roadmapIcon",
                  },
                },
              },
            },
          },
        ]),
        MilestoneTable.aggregate([
          { $match: { _id: new ObjectId(milestoneId) } },
          {
            $lookup: {
              from: "milestone_goals",
              localField: "_id",
              foreignField: "milestoneId",
              as: "milestoneGoals",
            },
          },
          {
            $project: {
              _id: 0,
              milestoneId: "$_id",
              milestone: 1,
              milestoneGoals: {
                $map: {
                  input: "$milestoneGoals",
                  as: "goal",
                  in: {
                    title: "$$goal.title",
                    day: "$$goal.day",
                    order: "$$goal.order",
                    dayTitle: "$$goal.dayTitle",
                    icon: "$$goal.roadmapIcon",
                  },
                },
              },
            },
          },
        ]),
      ]);

      firstMilestone[0].milestoneGoals.sort((a, b) => {
        if (a.day !== b.day) {
          return a.day - b.day;
        }
        return a.order - b.order;
      });
      selectedMilestone[0].milestoneGoals.sort((a, b) => {
        if (a.day !== b.day) {
          return a.day - b.day;
        }
        return a.order - b.order;
      });
      if (milestoneId.toString() == firstMilestone[0].milestoneId.toString()) {
        roadMap = this.formatRoadmap(firstMilestone[0]);
        roadMap[0].data[0]["progress"] = 0;
      } else {
        const firstDayGoals = firstMilestone[0].milestoneGoals.map(
          (obj) => obj.title
        );
        roadMap = this.formatRoadmap(selectedMilestone[0]);
        roadMap[0].data.unshift({
          title: firstMilestone[0].milestone,
          progress: 0,
          icon: firstMilestone[0].milestoneGoals[0].icon,
          data: firstDayGoals,
        });
      }
      roadMap[roadMap.length - 1].data.push({
        title: "Completed Milestone",
        icon: "trophy.webp",
      });
      return roadMap;
    } catch (error) {
      throw new NetworkError(
        "Error occurred while retrieving new Milestone",
        400
      );
    }
  }

  /**
   * @description format milestone goals day-wise
   * @param milestone
   * @returns {*}
   */
  private formatRoadmap(milestone: any) {
    try {
      const dailyGoals = {};
      const roadMap = [];
      milestone.milestoneGoals.map((obj) => {
        if (dailyGoals[`Day ${obj.day}`]) {
          dailyGoals[`Day ${obj.day}`].data.push(obj.title);
        } else {
          dailyGoals[`Day ${obj.day}`] = {};
          dailyGoals[`Day ${obj.day}`]["title"] = obj.dayTitle;
          dailyGoals[`Day ${obj.day}`]["icon"] = obj.icon;
          dailyGoals[`Day ${obj.day}`]["data"] = [obj.title];
        }
      });
      Object.keys(dailyGoals).map((day) => {
        roadMap.push({
          title: day,
          data: [dailyGoals[day]],
        });
      });
      return roadMap;
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }

  /**
   * @description format milestone goals day-wise
   * @param key
   * @returns {*}
   */
  private async getDayTitle(key: any) {
    try {
      const actionDetails = await MilestoneGoalsTable.findOne({ key });
      return actionDetails.dayTitle;
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }

  /**
   * @description get event information
   * @param action eventId
   * @returns {*}
   */
  private async getEventDetails(action: any) {
    try {
      let employee = null;
      const eventDetails = await MilestoneEventsTable.findOne({
        eventId: action.quizNum,
      }).lean();
      if (eventDetails) {
        // add employee reward to first event results for time being
        if (eventDetails.eventId == 10001) {
          // get default employee details on completion of first day goals
          const employeeDetails = await EmployeeTable.findOne({
            order: 1,
          }).lean();
          if (employeeDetails) {
            employee = { ...DEFAULT_EMPLOYEE, employeeId: employeeDetails._id };
          }
        }
        return {
          ...action,
          resultCopyInfo: null,
          ...eventDetails,
          title: MILESTONE_HOMEPAGE.EVENT.title,
          iconBackgroundColor: "#4885FF29",
          iconImage: "cal.webp",
          time: "1 min",
          key: MILESTONE_HOMEPAGE.EVENT.key,
          employee,
        };
      }

      return eventDetails;
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }

  /**
   * @description get event information
   * @param userExists
   * @param data event user response
   * @returns {*}
   */
  public async saveEventResult(userExists: any, data: any) {
    try {
      let updatedCash = 0,
        userUpdateObj = {};
      const isLastDayOfMilestone = data?.isLastDayOfMilestone;
      const stageUnlockedInfo = data?.stageUnlockedInfo;
      let updatedCoins = userExists.quizCoins + data.tokens;
      const currentCash = userExists?.cash > 0 ? userExists?.cash : 50;
      const changeInCash = Math.floor((currentCash / 100) * data.cash);
      updatedCash = currentCash + changeInCash;
      let updatedBusinessScore =
        (userExists.businessScore?.current || 90) + data.businessScore;
      let updatedOperationsScore =
        (userExists.businessScore?.operationsScore || 90) + data.businessScore;
      let updatedProductScore =
        (userExists.businessScore?.productScore || 90) + data.businessScore;
      let updatedGrowthScore =
        (userExists.businessScore?.growthScore || 90) + data.businessScore;
      if (stageUnlockedInfo) {
        const newStage = stageUnlockedInfo?.stageInfo?.name;
        const newStageDetails = await StageTable.findOne({ title: newStage });
        const resultSummary = stageUnlockedInfo?.resultSummary;
        updatedCoins += resultSummary[0].title;
        updatedCash += resultSummary[1].title;
        updatedBusinessScore += resultSummary[2].title;
        updatedOperationsScore += resultSummary[2].title;
        updatedProductScore += resultSummary[2].title;
        updatedGrowthScore += resultSummary[2].title;
        userUpdateObj = { stage: newStageDetails._id };
      }
      userUpdateObj = {
        $set: {
          ...userUpdateObj,
          quizCoins: updatedCoins,
          cash: updatedCash,
          "businessScore.current": updatedBusinessScore,
          "businessScore.operationsScore": updatedOperationsScore,
          "businessScore.productScore": updatedProductScore,
          "businessScore.growthScore": updatedGrowthScore,
        },
      };
      let businessProfileObj = {};
      if (isLastDayOfMilestone) {
        const [milestones, businessProfile] = await Promise.all([
          MilestoneTable.find(),
          BusinessProfileTable.findOne({ userId: userExists._id }),
        ]);
        const curentMilestone = milestones.find(
          (milestone) =>
            businessProfile.currentMilestone.milestoneId.toString() ==
            milestone._id.toString()
        );
        const currentMilestoneOrder = curentMilestone.order;
        const nextMilestone = milestones.find(
          (milestone) => milestone.order == currentMilestoneOrder + 1
        );
        businessProfileObj = {
          currentMilestone: {
            milestoneId: nextMilestone._id,
            milestoneUpdatedAt: new Date().toISOString(),
          },
        };
      }
      await Promise.all([
        UserTable.findOneAndUpdate({ _id: userExists.id }, userUpdateObj),
        QuizResult.create({
          topicId: null,
          quizId: data.quizId,
          userId: userExists._id,
          isOnBoardingQuiz: false,
          pointsEarned: data.tokens,
          numOfIncorrectAnswers: 0,
        }),
        BusinessProfileTable.findOneAndUpdate(
          { userId: userExists._id },
          { $set: businessProfileObj },
          { upsert: true }
        ),
      ]);
      return true;
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }
}
export default new MilestoneDBService();
