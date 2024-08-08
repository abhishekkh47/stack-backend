import { NetworkError } from "@app/middleware";
import { MilestoneTable, MilestoneResultTable } from "@app/model";
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
  public async getNextMilestones(userIfExists: any) {
    try {
      const [lastMilestoneCompleted, milestones] = await Promise.all([
        MilestoneResultTable.find({
          userId: userIfExists._id,
        }).lean(),
        MilestoneTable.find({ order: { $lte: 5 } })
          .sort({ order: 1 })
          .lean(),
      ]);
      if (!lastMilestoneCompleted) {
        return this.getFlattendMilestoneArray(milestones[0]);
      }
      return lastMilestoneCompleted;
    } catch (err) {
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
}
export default new MilestoneDBService();
