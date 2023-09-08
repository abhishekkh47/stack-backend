import { StreakGoalTable } from "@app/model";

class StreakScriptService {
  /**
   * @dscription This method add/update all streak goals in db
   * @param streakGoals
   * @return {boolean}
   */
  public async addStreakGoals(streakGoals: any[]) {
    try {
      let bulkWriteQuery = [];
      streakGoals = streakGoals.map((data) => {
        let bulkWriteObject = {
          updateOne: {
            filter: { title: data.title },
            update: {
              $set: {
                title: data.title,
                day: data.day,
              },
            },
            upsert: true,
          },
        };
        bulkWriteQuery.push(bulkWriteObject);

        return data;
      });

      await StreakGoalTable.bulkWrite(bulkWriteQuery);
      return true;
    } catch (error) {
      return false;
    }
  }
}

export default new StreakScriptService();
