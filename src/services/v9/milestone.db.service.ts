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
} from "@app/utility";
import { ObjectId } from "mongodb";
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
      let response: any = {};
      const [lastMilestoneCompleted, availableDailyChallenges] =
        await Promise.all([
          MilestoneResultTable.findOne({
            userId: userIfExists._id,
          })
            .sort({ createdAt: -1 })
            .lean(),
          DailyChallengeTable.findOne({ userId: userIfExists._id }).lean(),
        ]);
      const [existingResponse, existingResponseWithPendingActions] =
        await Promise.all([
          this.handleAvailableDailyChallenges(
            userIfExists,
            businessProfile,
            availableDailyChallenges
          ),
          this.handleAvailableDailyChallenges(
            userIfExists,
            businessProfile,
            availableDailyChallenges,
            true
          ),
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
        !businessProfile?.currentMilestone?.milestoneId
      ) {
        response = await this.getFirstDayMilestoneGoals(userIfExists);
      } else {
        response = await this.getNextDayMilestoneGoals(
          userIfExists,
          businessProfile,
          lastMilestoneCompleted,
          existingResponseWithPendingActions,
          availableDailyChallenges
        );
      }
      if (
        response?.tasks?.length &&
        !response?.tasks[0]?.data?.length &&
        !response?.tasks[1]?.data?.length
      ) {
        return { isMilestoneHit: true };
      }
      let currentGoal = {};
      if (response.isMilestoneHit) {
        response.tasks.unshift({
          title: "Today's Goals",
          data: [],
        });
      }
      if (response?.tasks[0]?.data[0]) {
        currentGoal = response?.tasks[0]?.data[0];
      } else {
        currentGoal = lastMilestoneCompleted;
      }
      const learningContent = (await this.getLearningContent(currentGoal)).sort(
        (a, b) => b?.type - a?.type
      );
      await Promise.all(
        learningContent?.map(async (obj) => {
          const quizResult = await QuizResult.findOne({
            userId: userIfExists._id,
            quizId: obj?.quizId,
          });
          if (!quizResult) {
            response.tasks[0].data.unshift(obj);
          }
        })
      );
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
      const lastUpdated =
        businessProfile?.currentMilestone?.milestoneUpdatedAt ||
        new Date().toISOString();
      let response = {
        isMilestoneHit,
        tasks: [
          { title: "Today's Goals", data: [] },
          { title: "Completed", data: [] },
        ],
      };
      milestones.forEach((milestone) => {
        if (
          milestone.key == "ideaValidation" ||
          milestone.key == "description"
        ) {
          if (businessProfile?.description) {
            milestone["isCompleted"] = true;
            response.tasks[1].data.push(milestone);
          } else {
            milestone["isCompleted"] = false;
            response.tasks[0].data.push(milestone);
          }
        } else if (businessProfile) {
          const hasGoalInProfile = hasGoalKey(businessProfile, milestone.key);
          const hasGoalInCompletedActions = mapHasGoalKey(
            businessProfile.completedActions,
            milestone.key
          );
          if (hasGoalInProfile || hasGoalInCompletedActions) {
            milestone["isCompleted"] = true;
            response.tasks[1].data.push(milestone);
          } else {
            milestone["isCompleted"] = false;
            response.tasks[0].data.push(milestone);
          }
        } else {
          milestone["isCompleted"] = false;
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
  public async saveMilestoneGoalResults(userIfExists: any, goalId: any) {
    try {
      const goal = await MilestoneGoalsTable.findOne({ _id: goalId }).lean();
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
      const suggestionScreenCopy =
        await SuggestionScreenCopyTable.find().lean();
      const updatedGoals = initialGoals.map((goal) => {
        const copyData = suggestionScreenCopy.find(
          (obj) => obj.key == goal.key
        );
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
    override: boolean = false
  ) {
    try {
      const suggestionScreenCopy = await SuggestionScreenCopyTable.find(
        {}
      ).lean();
      let isMilestoneHit = false;
      const goalsLength = availableDailyChallenges?.dailyGoalStatus?.length;
      if (
        goalsLength &&
        (getDaysNum(userIfExists, availableDailyChallenges["updatedAt"]) < 1 ||
          override) &&
        businessProfile.currentMilestone?.milestoneId?.toString() ==
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
            { title: "Today's Goals", data: [] },
            { title: "Completed", data: [] },
          ],
        };

        updatedGoals.forEach((goal) => {
          const copyData = suggestionScreenCopy.find(
            (obj) => obj.key == goal.key
          );
          goal.inputTemplate.suggestionScreenInfo = copyData;
        });

        updatedGoals.forEach((goal) => {
          if (goal.key == "ideaValidation" || goal.key == "description") {
            if (businessProfile?.description) {
              goal["isCompleted"] = true;
              response.tasks[1].data.push(goal);
            } else {
              goal["isCompleted"] = false;
              response.tasks[0].data.push(goal);
            }
          } else if (businessProfile) {
            const hasGoalInProfile = hasGoalKey(businessProfile, goal.key);
            const hasGoalInCompletedActions = mapHasGoalKey(
              businessProfile.completedActions,
              goal.key
            );
            if (hasGoalInProfile || hasGoalInCompletedActions) {
              goal["isCompleted"] = true;
              response.tasks[1].data.push(goal);
            } else {
              goal["isCompleted"] = false;
              response.tasks[0].data.push(goal);
            }
          }
        });
        if (!response?.tasks[0]?.data?.length) {
          const milestoneId = response?.tasks[1]?.data[0]?.milestoneId;
          const daysInCurrentMilestone = (
            await MilestoneGoalsTable.find({
              milestoneId,
            })
              .sort({ day: -1 })
              .lean()
          )[0].day;
          const completedGoalsLength = response?.tasks[1]?.data.length;
          isMilestoneHit =
            response?.tasks[1]?.data[completedGoalsLength - 1].day ==
            daysInCurrentMilestone;
          response.isMilestoneHit = isMilestoneHit;
          if (isMilestoneHit) {
            response.tasks.shift();
          }
        } else if (!response?.tasks[1]?.data.length) {
          response.tasks.pop();
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
   * @param key identifier of action
   * @returns {*}
   */
  public async getActionDetails(key: string) {
    try {
      const [goalDetails, inputTemplate] = await Promise.all([
        MilestoneGoalsTable.findOne({ key }).lean(),
        this.suggestionScreenInfo([{ key }]),
      ]);
      return { ...goalDetails, inputTemplate };
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
      let dailyGoal = null;
      let currentMilestoneId = businessProfile.currentMilestone?.milestoneId;
      if (!currentMilestoneId) {
        currentMilestoneId = await MilestoneTable.findOne({ order: 1 });
      }
      const [
        currentMilestone,
        milestoneGoals,
        lastGoalCompleted,
        completedMilestoneGoals,
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
        MilestoneResultTable.countDocuments({
          userId,
          milestoneId: currentMilestoneId,
        }),
        DailyChallengeTable.findOne({ userId }),
      ]);

      let currentGoalId = null;
      const dailyGoalStatus = currentGoals?.dailyGoalStatus || [];
      if (dailyGoalStatus?.length > 0) {
        currentGoalId = new ObjectId(
          dailyGoalStatus[dailyGoalStatus.length - 1]._id
        );
      } else {
        currentGoalId = lastGoalCompleted?.goalId;
      }
      if (!currentGoalId && currentMilestoneId) {
        dailyGoal = await MilestoneGoalsTable.findOne({
          milestoneId: currentMilestoneId,
          day: 1,
        });
      } else {
        dailyGoal = await MilestoneGoalsTable.findOne({
          _id: currentGoalId,
        });
      }

      const totalGoals = milestoneGoals?.length;
      const totalDays = milestoneGoals[totalGoals - 1]?.day || 1;
      const currentDay = lastGoalCompleted?.day || 1;
      const progress = (completedMilestoneGoals / totalGoals) * 100;
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
}
export default new MilestoneDBService();
