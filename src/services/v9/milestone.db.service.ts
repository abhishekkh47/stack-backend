import { NetworkError } from "@app/middleware";
import { MilestoneTable } from "@app/model";
class MilestoneDBService {
  /**
   * @description get milestones
   * @returns {*}
   */
  public async getMilestones() {
    try {
      const milestones = await MilestoneTable.find({ order: { $lte: 5 } });
      return milestones;
    } catch (err) {
      throw new NetworkError(
        "Error occurred while retrieving coach profile",
        400
      );
    }
  }
}
export default new MilestoneDBService();
