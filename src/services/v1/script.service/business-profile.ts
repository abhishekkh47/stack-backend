import {
  ImpactTable,
  PassionTable,
  BusinessPassionTable,
  BusinessPassionAspectTable,
} from "@app/model";

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
   * @dscription This method add all passions in db
   * @param passions
   * @return {boolean}
   */
  public async addPassion(passions: any[]) {
    try {
      let bulkWriteQuery = [];
      passions = passions.map((data) => {
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

      await PassionTable.bulkWrite(bulkWriteQuery);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * @description This function convert spreadsheet data to JSON by filtering with quiz # for weekly journey
   * @param rows
   * @returns {*}
   */
  public async convertPassionSpreadSheetToJSON(rows: any) {
    const allPassions = [];
    const tempData = {};
    let order = 0;

    rows.forEach((item) => {
      if (!tempData[item.Passion]) {
        tempData[item.Passion] = {
          title: item.Passion,
          image: item["Passion Cover Image"],
          order: ++order,
          businessImages: [
            item["Business Image 1"],
            item["Business Image 2"],
            item["Business Image 3"],
          ],
          category: {},
        };
      }

      if (!tempData[item.Passion].category[item["Sub-Category"]]) {
        tempData[item.Passion].category[item["Sub-Category"]] = {
          title: item["Sub-Category"],
          image: item["Sub-Category Image"],
          problem: [],
        };
      }

      tempData[item.Passion].category[item["Sub-Category"]].problem.push(
        item.Problem
      );
    });

    for (const key in tempData) {
      const passion = tempData[key];
      passion.category = Object.values(passion.category);
      allPassions.push(passion);
    }

    return allPassions;
  }

  /**
   * @dscription This method add all passions in db
   * @param passions
   * @return {boolean}
   */
  public async addPassionAndProblemCategory(passions: any[]) {
    try {
      let passionsBulkWriteQuery = [];
      passions.map((data) => {
        let bulkWriteObject = {
          updateOne: {
            filter: { title: data.title },
            update: {
              $set: {
                title: data.title,
                order: data.order,
                image: data.image,
                businessImages: data.businessImages,
              },
            },
            upsert: true,
          },
        };
        passionsBulkWriteQuery.push(bulkWriteObject);
      });

      await BusinessPassionTable.bulkWrite(passionsBulkWriteQuery);
      let passionCategoryBulkWriteQuery = [];
      await Promise.all(
        passions.map(async (data) => {
          let passionIfExists = await BusinessPassionTable.find({
            title: data.title,
          });
          data.category.map((sub_category) => {
            let bulkWriteObject = {
              updateOne: {
                filter: { aspect: sub_category["title"] },
                update: {
                  $set: {
                    aspect: sub_category["title"],
                    aspectImage: sub_category["image"],
                    businessPassionId: passionIfExists[0]._id,
                    problems: sub_category.problem,
                  },
                },
                upsert: true,
              },
            };
            passionCategoryBulkWriteQuery.push(bulkWriteObject);
          });
        })
      );
      await BusinessPassionAspectTable.bulkWrite(passionCategoryBulkWriteQuery);
      return true;
    } catch (error) {
      return error;
    }
  }
}

export default new BusinessProfileScriptService();
