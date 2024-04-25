import { NetworkError } from "@app/middleware";
import { QuizTopicTable } from "@app/model";
import { START_FROM_SCRATCH, PERFECT_IDEA } from "@app/utility";
class ChecklistDBService {
  /**
   * @description get all Topics and current level in each topic
   * @returns {*}
   */
  public async getFocusArea() {
    try {
      let startFromScratch = { ...START_FROM_SCRATCH };
      let focusAreas = await QuizTopicTable.aggregate([
        {
          $match: {
            type: 4,
          },
        },
        {
          $sort: {
            order: 1,
          },
        },
        {
          $lookup: {
            from: "quiz_categories",
            localField: "_id",
            foreignField: "topicId",
            as: "categories",
          },
        },
        {
          $project: {
            _id: 1,
            title: "$topic",
            image: 1,
            order: 1,
            "categories._id": 1,
            "categories.title": 1,
            "categories.description": 1,
            "categories.order": 1,
          },
        },
      ]);

      startFromScratch._id = focusAreas[0]._id;
      startFromScratch.categories = [...focusAreas[0].categories];
      focusAreas.push(startFromScratch);
      focusAreas.map((area) => area.categories.push(PERFECT_IDEA));

      return focusAreas;
    } catch (err) {
      throw new NetworkError(
        "Error occurred while retrieving quiz topics",
        400
      );
    }
  }
}
export default new ChecklistDBService();
