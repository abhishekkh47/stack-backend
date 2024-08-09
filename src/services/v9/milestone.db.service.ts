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
      const milestones = await MilestoneTable.find({
        order: { $lte: 5 },
      })
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
   * @description get next milestone
   * @param userIfExists
   * @returns {*}
   */
  public async getNextMilestone(
    userIfExists: any,
    businessProfileIfExists: any
  ) {
    try {
      const [lastMilestoneCompleted, milestones] = await Promise.all([
        MilestoneResultTable.find({
          userId: userIfExists._id,
        })
          .sort({ updatedAt: -1 })
          .lean(),
        MilestoneTable.find({ order: { $lte: 5 } })
          .sort({ order: 1 })
          .lean(),
      ]);
      if (!lastMilestoneCompleted.length) {
        const initialMilestone = await MilestoneTable.findOne({
          milestone: DEFAULT_MILESTONE,
        });
        const currentDate = new Date().toISOString();
        const updateObj = {
          milestoneId: initialMilestone._id,
          milestoneUpdatedAt: currentDate,
        };
        const [businessProfile, initialGoals] = await Promise.all([
          BusinessProfileTable.findOneAndUpdate(
            { userId: userIfExists._id },
            { $set: updateObj },
            { new: true }
          ),
          MilestoneGoalsTable.find({
            milestoneId: initialMilestone._id,
          })
            .sort({ order: 1 })
            .lean(),
        ]);
        return this.formatMilestones(
          userIfExists,
          businessProfile,
          initialGoals
        );
        // return this.getFlattendMilestoneArray(milestones[0]);
      }
      const ifNextGoalAvailable = await this.checkNextDayMilestone(
        lastMilestoneCompleted
      );
      return this.formatMilestones(
        businessProfileIfExists,
        ifNextGoalAvailable,
        milestones
      );
    } catch (error) {
      throw new NetworkError(
        "Error occurred while retrieving coach profile",
        400
      );
    }
  }

  private getFlattendMilestoneArray(milestones: any) {
    const { goals, _id, createdAt, updatedAt, ...parentFields } = milestones;
    const flattenedArray = goals.map((goal) => {
      const { _id: goalId, title, ...goalFields } = goal;
      return {
        ...parentFields,
        goalTitle: title,
        ...goalFields,
      };
    });
    return flattenedArray;
  }

  private async formatMilestones(
    userIfExists: any,
    businessProfile: any,
    milestones: any
  ) {
    let response = null;
    const lastUpdated = businessProfile.currentMilestone.milestoneUpdatedAt;
    const dateDiff = getDaysNum(userIfExists, lastUpdated);

    response = {
      isMilestoneHit: false,
      tasks: [
        { title: "Goals of the day", data: [] },
        { title: "Completed", data: [] },
      ],
    };
    milestones.forEach((milestone) => {
      if (businessProfile[milestone.key]) {
        milestone["isCompleted"] = true;
        milestone["isLocked"] = false;
        response.tasks[1].data.push(milestone);
      } else {
        milestone["isCompleted"] = false;
        milestone["isLocked"] = false;
        response.tasks[0].data.push(milestone);
      }
    });

    return response;
  }

  private async checkNextDayMilestone(lastGoalCompleted) {
    try {
      const { day, milestoneId } = lastGoalCompleted;
      let nextDayGoalData = null;
      const milestoneGoals = await MilestoneGoalsTable.find({ milestoneId });
      // order=1 on next day
      if (!nextDayGoalData) {
        nextDayGoalData = milestoneGoals.find(
          (item) => item.order == 1 && item.day == day + 1
        );
      }
      return nextDayGoalData;
    } catch (error) {
      throw new NetworkError(
        "Error occurred while retrieving new Milestone",
        400
      );
    }
  }

  public async getMilestoneGoals(milestoneId) {
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
}
export default new MilestoneDBService();
