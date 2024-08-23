import { NetworkError } from "@app/middleware";
import {
  MilestoneTable,
  MilestoneResultTable,
  BusinessProfileTable,
  MilestoneGoalsTable,
  DailyChallengeTable,
  SuggestionScreenCopyTable,
} from "@app/model";
import { DEFAULT_MILESTONE, getDaysNum } from "@app/utility";
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
            order: { $lte: 5 },
          },
          {
            _id: 1,
            title: "$milestone",
            topicId: 1,
            time: "$description",
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
      let response = null;
      const [
        lastMilestoneCompleted,
        defaultMilestone,
        availableDailyChallenges,
      ] = await Promise.all([
        MilestoneResultTable.find({
          userId: userIfExists._id,
        })
          .sort({ updatedAt: -1 })
          .lean(),
        MilestoneGoalsTable.findOne({
          milestone: "Foundations of Successful Company Building",
        }),
        DailyChallengeTable.findOne({ userId: userIfExists._id }).lean(),
      ]);
      const existingResponse = await this.handleAvailableDailyChallenges(
        userIfExists,
        businessProfile,
        availableDailyChallenges
      );
      if (existingResponse) {
        return existingResponse;
      }

      // when user signup/login after updating app on day-1, return day-1 goals of default Milestone
      if (
        lastMilestoneCompleted.length === 0 ||
        !businessProfile?.currentMilestone?.milestoneId
      ) {
        response = await this.getFirstDayMilestoneGoals(userIfExists);
      } else if (
        businessProfile.currentMilestone?.milestoneId &&
        (businessProfile.currentMilestone?.milestoneId).toString() ==
          defaultMilestone.toString()
      ) {
        response = await this.checkDefaultMilestoneStatus(
          userIfExists,
          businessProfile,
          defaultMilestone
        );
      } else {
        response = await this.getNextDayMilestone(
          userIfExists,
          businessProfile
        );
      }
      return response;
    } catch (error) {
      throw new NetworkError("Error occurred while retrieving milestones", 400);
    }
  }

  /**
   * @description get current goals
   * @param userIfExists
   * @param businessProfile
   * @param milestones goals array of current milestone
   * @param isMilestoneHit if all goals of current milestone are hit or not
   * @param daysInCurrentMilestone total number of days in current milestone
   * @returns {*}
   */
  private formatMilestones(
    userIfExists: any,
    businessProfile: any,
    milestones: any,
    isMilestoneHit: boolean = false,
    daysInCurrentMilestone: number = 0
  ) {
    try {
      const lastUpdated =
        businessProfile?.currentMilestone?.milestoneUpdatedAt ||
        new Date().toISOString();
      const dateDiff = getDaysNum(userIfExists, lastUpdated);
      let response = {
        isMilestoneHit,
        tasks: [
          { title: "Goals of the day", data: [] },
          { title: "Completed", data: [] },
        ],
      };
      milestones.forEach((milestone) => {
        if (
          milestone.key == "ideaValidation" ||
          milestone.key == "description"
        ) {
          if (businessProfile?.description) {
            if (dateDiff < milestone.day) {
              milestone["isCompleted"] = true;
              response.tasks[1].data.push(milestone);
            }
          } else {
            milestone["isCompleted"] = false;
            response.tasks[0].data.push(milestone);
          }
        } else if (
          businessProfile &&
          businessProfile[milestone.key] &&
          (businessProfile[milestone.key].title ||
            businessProfile[milestone.key].length)
        ) {
          if (dateDiff < milestone.day) {
            milestone["isCompleted"] = true;
            response.tasks[1].data.push(milestone);
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
          milestone: DEFAULT_MILESTONE,
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
          { new: true }
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
      return this.formatMilestones(userIfExists, businessProfile, updatedGoals);
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
   * @param businessProfile
   * @param milestoneId
   * @returns {*}
   */
  public async checkDefaultMilestoneStatus(
    userIfExists: any,
    businessProfile: any,
    milestoneId: any
  ) {
    try {
      let isMilestoneHit = false;
      const milestoneUpdatedAt =
        businessProfile.currentMilestone.milestoneUpdatedAt;
      const daysNum = getDaysNum(userIfExists, milestoneUpdatedAt);
      const initialGoals = await MilestoneGoalsTable.find({
        milestoneId,
        day: { $lte: daysNum + 1 },
      })
        .sort({ day: 1, order: 1 })
        .lean();
      if (!initialGoals.length) {
        isMilestoneHit = true;
      }
      const goalsData = await this.suggestionScreenInfo(initialGoals);
      const updatedGoals = this.setLockedGoals(goalsData, businessProfile);
      return this.formatMilestones(
        userIfExists,
        businessProfile,
        updatedGoals,
        isMilestoneHit
      );
    } catch (error) {
      throw new NetworkError("Error occurred while retrieving milestones", 400);
    }
  }

  /**
   * @description this method will fetch the next available milestone goals
   * @param userIfExists
   * @param businessProfile
   * @returns {*}
   */
  private async getNextDayMilestone(userIfExists: any, businessProfile: any) {
    try {
      let isMilestoneHit = false;
      const { milestoneId, milestoneUpdatedAt } =
        businessProfile.currentMilestone;
      const daysNum = getDaysNum(userIfExists, milestoneUpdatedAt);
      const currentMilestoneGoals = await MilestoneGoalsTable.find({
        milestoneId,
        day: { $lte: daysNum + 1 },
      })
        .sort({ day: 1, order: 1 })
        .lean();

      const goalsData = await this.suggestionScreenInfo(currentMilestoneGoals);
      const updatedGoals = this.setLockedGoals(goalsData, businessProfile);
      const daysInCurrentMilestone = (
        await MilestoneGoalsTable.find({
          milestoneId,
        })
          .sort({ day: -1 })
          .lean()
      )[0].day;
      await DailyChallengeTable.updateOne(
        { userId: userIfExists._id },
        { $set: { userId: userIfExists._id, dailyGoalStatus: updatedGoals } },
        { upsert: true }
      );
      return this.formatMilestones(
        userIfExists,
        businessProfile,
        updatedGoals,
        isMilestoneHit,
        daysInCurrentMilestone
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
          : !goal?.dependency?.every(
              (dependencyKey) =>
                businessProfile &&
                businessProfile[dependencyKey] &&
                (businessProfile[dependencyKey].title ||
                  businessProfile[dependencyKey].length)
            );
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
    availableDailyChallenges: any
  ) {
    try {
      let isMilestoneHit = false;
      if (
        availableDailyChallenges?.dailyGoalStatus &&
        getDaysNum(userIfExists, availableDailyChallenges["updatedAt"]) < 1
      ) {
        const updatedGoals = this.setLockedGoals(
          availableDailyChallenges.dailyGoalStatus,
          businessProfile
        );
        let response = {
          isMilestoneHit: false,
          tasks: [
            { title: "Goals of the day", data: [] },
            { title: "Completed", data: [] },
          ],
        };
        updatedGoals.forEach((goal) => {
          if (goal.key == "ideaValidation" || goal.key == "description") {
            if (businessProfile?.description) {
              goal["isCompleted"] = true;
              response.tasks[1].data.push(goal);
            } else {
              goal["isCompleted"] = false;
              response.tasks[0].data.push(goal);
            }
          } else if (
            businessProfile &&
            businessProfile[goal.key] &&
            (businessProfile[goal.key].title ||
              businessProfile[goal.key].length)
          ) {
            goal["isCompleted"] = true;
            response.tasks[1].data.push(goal);
          } else {
            goal["isCompleted"] = false;
            response.tasks[0].data.push(goal);
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
      }
      return null;
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }
}
export default new MilestoneDBService();
