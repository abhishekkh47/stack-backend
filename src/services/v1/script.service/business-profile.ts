import { ImpactTable, InterestTable } from "@app/model";

class BusinessProfileScriptService {
  /**
   * @dscription This method add all impacts in db
   * @param impacts
   * @return {boolean}
   */
  public async addImpacts(impacts: any[]) {
    try {
      let bulkWriteQuery = [];
      impacts = impacts.map((data) => {
        let bulkWriteObject = {
          updateOne: {
            filter: { title: data.title },
            update: {
              $set: {
                title: data.title,
                order: data.order,
                image: data.image,
              },
            },
            upsert: true,
          },
        };
        bulkWriteQuery.push(bulkWriteObject);

        return data;
      });

      await ImpactTable.bulkWrite(bulkWriteQuery);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * @dscription This method add all interests in db
   * @param interests
   * @return {boolean}
   */
  public async addInterests(interests: any[]) {
    try {
      let bulkWriteQuery = [];
      interests = interests.map((data) => {
        let bulkWriteObject = {
          updateOne: {
            filter: { title: data.title },
            update: {
              $set: {
                title: data.title,
                order: data.order,
                image: data.image,
              },
            },
            upsert: true,
          },
        };
        bulkWriteQuery.push(bulkWriteObject);

        return data;
      });

      await InterestTable.bulkWrite(bulkWriteQuery);
      return true;
    } catch (error) {
      return false;
    }
  }
}

export default new BusinessProfileScriptService();
