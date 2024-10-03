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
} from "@app/model";
import {
  getDaysNum,
  mapHasGoalKey,
  hasGoalKey,
  LEARNING_CONTENT,
  ACTIVE_MILESTONE,
  MILESTONE_HOMEPAGE,
} from "@app/utility";
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
      MilestoneGoalsTable.find({ milestoneId }).lean(),
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
   * @returns {*}
   */
  public async getCurrentMilestoneGoals(
    userIfExists: any,
    businessProfile: any
  ) {
    try {
      let response: any = {
        isMilestoneHit: false,
        tasks: [],
      };
      const currentMilestoneId = businessProfile?.currentMilestone?.milestoneId;
      const [lastMilestoneCompleted, availableDailyChallenges] =
        await Promise.all([
          MilestoneResultTable.findOne({
            userId: userIfExists._id,
          })
            .sort({ createdAt: -1 })
            .lean(),
          DailyChallengeTable.findOne({ userId: userIfExists._id }).lean(),
        ]);
      let completedActions = Object.keys(businessProfile?.completedActions);
      if (businessProfile.description) {
        completedActions = ["ideaValidation", ...completedActions];
      }
      const [
        existingResponse,
        existingResponseWithPendingActions,
        completedActionsResponse,
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
        this.getActionDetails(completedActions, currentMilestoneId),
      ]);
      const tasks = existingResponseWithPendingActions?.tasks;
      if (existingResponse) {
        response = existingResponse;
      } else if (tasks?.length == 2 && tasks[0]?.data?.length > 0) {
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
      if (completedActionsResponse?.length) {
        response.tasks.push({
          title: MILESTONE_HOMEPAGE.COMPLETED_GOALS,
          data: completedActionsResponse,
        });
      } else if (
        completedActionsResponse?.length &&
        response?.tasks?.length > 1
      ) {
        response.tasks[1].data = completedActionsResponse;
      }
      if (
        response?.tasks?.length &&
        !response?.tasks[0]?.data?.length &&
        !response?.tasks[1]?.data?.length
      ) {
        return { isMilestoneHit: true };
      }
      let currentGoal = {};
      if (
        response?.tasks[0]?.data[0] &&
        response.tasks[0].title == MILESTONE_HOMEPAGE.GOALS_OF_THE_DAY
      ) {
        currentGoal = response?.tasks[0]?.data[0];
      } else {
        currentGoal = lastMilestoneCompleted;
      }

      if (
        (currentMilestoneId &&
          response.tasks[0].title != MILESTONE_HOMEPAGE.GOALS_OF_THE_DAY) ||
        (response.tasks[0].title == MILESTONE_HOMEPAGE.GOALS_OF_THE_DAY &&
          response.tasks[0].data.length == 0)
      ) {
        response.isMilestoneHit = await this.checkIfMilestoneHit(
          lastMilestoneCompleted,
          currentMilestoneId
        );
      } else {
        response.isMilestoneHit = false;
      }
      // order -> quiz, story, simulation
      const order = { 1: 0, 3: 1, 2: 2 };
      const learningContent = (await this.getLearningContent(currentGoal)).sort(
        (a, b) => order[b?.type] - order[a?.type]
      );
      if (
        learningContent &&
        response.tasks[0].title != MILESTONE_HOMEPAGE.GOALS_OF_THE_DAY
      ) {
        response?.tasks?.unshift({
          title: MILESTONE_HOMEPAGE.GOALS_OF_THE_DAY,
          data: [],
        });
      }
      const quizIds = learningContent?.map((obj) => obj.quizId);
      const completedQuizzes = await QuizResult.find(
        {
          userId: userIfExists._id,
          quizId: { $in: quizIds },
        },
        { quizId: 1 }
      );
      learningContent?.forEach(async (obj) => {
        const isQuizCompleted = completedQuizzes.some(
          (quiz) => quiz.quizId.toString() == obj.quizId.toString()
        );
        if (!isQuizCompleted) {
          response?.tasks[0]?.data?.unshift(obj);
        } else {
          obj[MILESTONE_HOMEPAGE.IS_COMPLETED] = true;
          if (response?.tasks[1]) {
            response?.tasks[1].data.unshift(obj);
          } else {
            response?.tasks?.push({
              title: MILESTONE_HOMEPAGE.COMPLETED_GOALS,
              data: [obj],
            });
          }
        }
      });
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
      let response = {
        isMilestoneHit,
        tasks: [
          { title: MILESTONE_HOMEPAGE.GOALS_OF_THE_DAY, data: [] },
          { title: MILESTONE_HOMEPAGE.COMPLETED_GOALS, data: [] },
        ],
      };
      milestones.forEach((milestone) => {
        if (
          milestone.key == "ideaValidation" ||
          milestone.key == "description"
        ) {
          if (businessProfile?.description) {
            milestone[MILESTONE_HOMEPAGE.IS_COMPLETED] = true;
            response.tasks[1].data.push(milestone);
          } else {
            milestone[MILESTONE_HOMEPAGE.IS_COMPLETED] = false;
            response.tasks[0].data.push(milestone);
          }
        } else if (businessProfile) {
          const hasGoalInProfile = hasGoalKey(businessProfile, milestone.key);
          const hasGoalInCompletedActions = mapHasGoalKey(
            businessProfile.completedActions,
            milestone.key
          );
          if (hasGoalInProfile || hasGoalInCompletedActions) {
            milestone[MILESTONE_HOMEPAGE.IS_COMPLETED] = true;
            response.tasks[1].data.push(milestone);
          } else {
            milestone[MILESTONE_HOMEPAGE.IS_COMPLETED] = false;
            response.tasks[0].data.push(milestone);
          }
        } else {
          milestone[MILESTONE_HOMEPAGE.IS_COMPLETED] = false;
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
    try {
      const suggestionScreenCopy = await SuggestionScreenCopyTable.find(
        {}
      ).lean();
      let isMilestoneHit = false;
      const currentMilestoneId = businessProfile.currentMilestone?.milestoneId;
      const goalsLength = availableDailyChallenges?.dailyGoalStatus?.length;
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
          tasks: [{ title: MILESTONE_HOMEPAGE.GOALS_OF_THE_DAY, data: [] }],
        };

        updatedGoals.forEach((goal) => {
          const copyData = suggestionScreenCopy.find(
            (obj) => obj.key == goal.key
          );
          goal.inputTemplate.suggestionScreenInfo = copyData;
        });

        updatedGoals.forEach((goal) => {
          if (goal.key == "ideaValidation" || goal.key == "description") {
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
   * @param actionObj Ai action details of current active milestone
   * @returns {*}
   */
  private async getLearningContent(actionObj: any) {
    try {
      let learningActions = null;
      if (actionObj?.milestoneId) {
        learningActions = await QuizLevelTable.findOne({
          milestoneId: actionObj?.milestoneId,
          day: actionObj?.day,
        }).lean();
      }
      if (!learningActions) return null;
      const challengeDetails = await this.getQuizDetails(
        learningActions?.actions
      );
      return challengeDetails;
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
      const updatedActions = await Promise.all(
        actions.map(async (action) => {
          const quizDetails = await QuizTable.findOne({ _id: action?.quizId });
          const time =
            action.type == 1
              ? `Earn ${action?.reward} tokens - 1 min`
              : `Earn ${action?.reward} tokens - 3 min`;
          if (quizDetails) {
            return {
              ...action,
              title: quizDetails?.quizName,
              iconBackgroundColor: LEARNING_CONTENT.iconBGColor,
              iconImage: LEARNING_CONTENT.icon,
              characterName: quizDetails?.characterName,
              characterImage: quizDetails?.characterImage,
              time,
              key: "challenges",
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
   * @param keys array of action identifiers
   * @param currentMilestoneId current milestone id
   * @returns {*}
   */
  public async getActionDetails(keys: string[], currentMilestoneId: any) {
    try {
      const [goalDetails, inputTemplate] = await Promise.all([
        MilestoneGoalsTable.find(
          { key: { $in: keys }, milestoneId: currentMilestoneId },
          { id: 0, dependency: 0, categoryId: 0, createdAt: 0, updatedAt: 0 }
        ).lean(),
        this.keyBasedSuggestionScreenInfo(keys),
      ]);
      goalDetails.forEach((goal) => {
        goal["inputTemplate"]["suggestionScreenInfo"] = inputTemplate[goal.key];
        goal[MILESTONE_HOMEPAGE.IS_COMPLETED] = true;
        goal["isLocked"] = false;
      });
      return goalDetails;
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
   * @returns {*}
   */
  public async getMilestoneProgress(businessProfile) {
    try {
      const userId = businessProfile.userId;
      let dailyGoal = null,
        progress = 0;
      let currentMilestoneId = businessProfile.currentMilestone?.milestoneId;
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
      const [totalCurrentDayGoals, currentGoalCompletedChallenges] =
        await Promise.all([
          MilestoneGoalsTable.countDocuments({
            milestoneId: currentMilestoneId,
            day: currentDay,
          }),
          MilestoneResultTable.countDocuments({
            userId,
            milestoneId: currentMilestoneId,
            day: currentDay,
          }),
        ]);
      progress =
        (100 / totalDays) * (currentDay - 1) +
        (100 / totalDays / totalCurrentDayGoals) *
          currentGoalCompletedChallenges;
      return {
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
   * @param businessProfile
   * @returns {*}
   */
  public async getCompletedMilestones(userExists, businessProfile) {
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
   * @returns {*}
   */
  public async getUserMilestoneGoals(userExists, businessProfile) {
    try {
      const currentMilestone = businessProfile.currentMilestone.milestoneId;
      const [goals, milestoneProgress, completedMilestones] = await Promise.all(
        [
          this.getCurrentMilestoneGoals(userExists, businessProfile),
          this.getMilestoneProgress(businessProfile),
          this.getCompletedMilestones(userExists, businessProfile),
        ]
      );
      goals?.tasks?.unshift({
        title: MILESTONE_HOMEPAGE.CURRENT_MILESTONE,
        data: [milestoneProgress],
      });
      if (completedMilestones?.length > 0) {
        let updatedCompletedMilestones = completedMilestones;
        if (!goals.isMilestoneHit) {
          updatedCompletedMilestones = completedMilestones.filter(
            (obj) => currentMilestone.toString() != obj._id.toString()
          );
        }
        goals?.tasks?.push({
          title: MILESTONE_HOMEPAGE.COMPLETED_MILESTONES,
          data: updatedCompletedMilestones,
        });
      }
      const todaysGoalIdx = goals.tasks.findIndex(
        (obj) => obj.title == MILESTONE_HOMEPAGE.GOALS_OF_THE_DAY
      );
      const curentMilestoneIdx = goals.tasks.findIndex(
        (obj) => obj.title == MILESTONE_HOMEPAGE.CURRENT_MILESTONE
      );
      const completedMilestoneIdx = goals.tasks.findIndex(
        (obj) => obj.title == MILESTONE_HOMEPAGE.COMPLETED_MILESTONES
      );
      if (goals.isMilestoneHit) {
        goals.tasks = [goals.tasks[completedMilestoneIdx]];
        return goals;
      }
      if (todaysGoalIdx > -1) {
        goals.tasks[todaysGoalIdx][MILESTONE_HOMEPAGE.SHOW_PRO_BANNER] = true;
        if (goals.tasks[todaysGoalIdx].data.length < 1) {
          goals.tasks[curentMilestoneIdx][MILESTONE_HOMEPAGE.SHOW_PRO_BANNER] =
            true;
          goals.tasks.splice(todaysGoalIdx, 1);
        }
      } else if (curentMilestoneIdx > -1) {
        goals.tasks[curentMilestoneIdx][MILESTONE_HOMEPAGE.SHOW_PRO_BANNER] =
          true;
      }
      return goals;
    } catch (error) {
      throw new NetworkError(
        "Error occurred while retrieving new Milestone",
        400
      );
    }
  }

}
export default new MilestoneDBService();
