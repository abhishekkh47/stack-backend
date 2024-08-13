import { NetworkError } from "@app/middleware";
import {
  MilestoneTable,
  MilestoneResultTable,
  BusinessProfileTable,
  MilestoneGoalsTable,
} from "@app/model";
import { DEFAULT_MILESTONE, getDaysNum } from "@app/utility";
class MilestoneDBService {
  /**
   * @description get milestones
   * @returns {*}
   */
  public async getMilestones() {
    try {
      const milestones = await MilestoneTable.find(
        {
          order: { $lte: 5 },
        },
        { _id: 1, title: "$milestone", topicId: 1, time: "$description" }
      )
        .sort({ order: 1 })
        .lean();
      return milestones;
    } catch (err) {
      throw new NetworkError(
        "Error occurred while retrieving coach profile",
        400
      );
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
      const [lastMilestoneCompleted, defaultMilestone] = await Promise.all([
        MilestoneResultTable.find({
          userId: userIfExists._id,
        })
          .sort({ updatedAt: -1 })
          .lean(),
        MilestoneTable.findOne({
          milestone: DEFAULT_MILESTONE,
        }).then((doc) => doc?._id),
      ]);
      // when user signup/login after updating app on day-1, return day-1 goals of default Milestone
      if (
        lastMilestoneCompleted.length === 0 ||
        !businessProfile.currentMilestone?.milestoneId
      ) {
        return await this.getFirstDayMilestoneGoals(userIfExists);
      } else if (
        businessProfile.currentMilestone?.milestoneId &&
        (businessProfile.currentMilestone?.milestoneId).toString() ==
          defaultMilestone.toString()
      ) {
        return await this.checkDefaultMilestoneStatus(
          userIfExists,
          businessProfile,
          defaultMilestone
        );
      }
      return await this.getNextDayMilestone(userIfExists, businessProfile);
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
   * @returns {*}
   */
  private formatMilestones(
    userIfExists: any,
    businessProfile: any,
    milestones: any,
    isMilestoneHit: boolean = false
  ) {
    let response = null;
    const lastUpdated =
      businessProfile?.currentMilestone?.milestoneUpdatedAt ||
      new Date().toISOString();
    const dateDiff = getDaysNum(userIfExists, lastUpdated);
    response = {
      isMilestoneHit,
      tasks: [
        { title: "Goals of the day", data: [] },
        { title: "Completed", data: [] },
      ],
    };
    milestones.forEach((milestone) => {
      if (milestone.key == "ideaValidation" || milestone.key == "description") {
        if (businessProfile.description) {
          if (dateDiff < milestone.day) {
            milestone["isCompleted"] = true;
            response.tasks[1].data.push(milestone);
          }
        } else {
          milestone["isCompleted"] = false;
          response.tasks[0].data.push(milestone);
        }
      } else if (
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

    return response;
  }

  /**
   * @description get day-1 goals of defualt milestone
   * @param userIfExists
   * @returns {*}
   */
  public async getFirstDayMilestoneGoals(userIfExists) {
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
    const updatedGoals = initialGoals.map((goal) => {
      const isLocked = goal?.dependency?.some((dependencyKey) => {
        return !businessProfile[dependencyKey];
      });

      return {
        ...goal,
        isLocked, // add isLocked key to the object
      };
    });
    return this.formatMilestones(userIfExists, businessProfile, updatedGoals);
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
      const updatedGoals = initialGoals.map((goal) => {
        const isLocked = goal?.dependency?.some((dependencyKey) => {
          return !businessProfile[dependencyKey];
        });

        return {
          ...goal,
          isLocked, // add isLocked key to the object
        };
      });
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

  private async getNextDayMilestone(userIfExists: any, businessProfile: any) {
    try {
      let filteredGoals = [];
      const { milestoneId, milestoneUpdatedAt } =
        businessProfile.currentMilestone;
      const daysNum = getDaysNum(userIfExists, milestoneUpdatedAt);
      const [currentMilestoneGoals, lastMilestoneCompleted] = await Promise.all(
        [
          MilestoneGoalsTable.find({
            milestoneId,
          })
            .sort({ day: 1, order: 1 })
            .lean(),
          MilestoneResultTable.find({
            userId: businessProfile.userId,
            milestoneId,
          })
            .sort({ day: -1, order: -1 })
            .limit(1)
            .lean()[0],
        ]
      );

      if (!lastMilestoneCompleted) {
        filteredGoals = currentMilestoneGoals.filter(
          (goal) => goal.day <= daysNum + 1
        );
      }
      const updatedGoals = filteredGoals.map((goal) => {
        const isLocked = goal?.dependency?.some(
          (dependencyKey) => !businessProfile[dependencyKey]
        );

        return {
          ...goal,
          isLocked, // add isLocked key to the object
        };
      });
      return this.formatMilestones(userIfExists, businessProfile, updatedGoals);
    } catch (error) {
      throw new NetworkError(
        "Error occurred while retrieving new Milestone",
        400
      );
    }
  }
}
export default new MilestoneDBService();
