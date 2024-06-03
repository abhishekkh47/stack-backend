import {
  ImpactTable,
  PassionTable,
  BusinessPassionTable,
  BusinessPassionAspectTable,
  ActionScreenCopyTable,
  UserTable,
  BusinessProfileTable,
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
  public async convertPassionSpreadSheetToJSON(rows: any, type: number) {
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
          type: type,
          category: {},
        };
      }

      if (!tempData[item.Passion].category[item["Sub-Category"]]) {
        tempData[item.Passion].category[item["Sub-Category"]] = {
          title: item["Sub-Category"],
          image: item["Sub-Category Image"],
          problem: [],
          type: type,
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
            filter: { title: data.title, type: data.type },
            update: {
              $set: {
                title: data.title,
                order: data.order,
                image: data.image,
                businessImages: data.businessImages,
                type: data.type,
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
            type: data.type,
          });
          data.category.map((sub_category) => {
            let bulkWriteObject = {
              updateOne: {
                filter: {
                  aspect: sub_category["title"],
                  type: sub_category.type,
                },
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

  /**
   * @description This function convert spreadsheet data to JSON by filtering with key referring the action to be performed
   * @param rows
   * @returns {*}
   */
  public async convertActionScreenCopySheetToJSON(rows: any) {
    let tempData = {};
    let allDetails = [];

    rows.map((item) => {
      if (item.Key) {
        tempData = {
          key: item.Key,
          title: item["Loading Title"],
          week: item.Week,
          day: item.Day,
          steps: [
            item["Checklist Item 1"],
            item["Checklist Item 2"],
            item["Checklist Item 3"],
          ],
          hoursSaved: item["Hours Saved"],
          actionName: item["Action Title"],
          description: item.Description,
          placeHolderText: item["Place Holder Text"],
          maxCharLimit: item["Character Limit"],
          isMultiLine: item.IsMultiLine == "TRUE" ? true : false,
        };
        allDetails.push(tempData);
      }
    });
    return allDetails;
  }

  /**
   * @dscription This method add action screen copy in DB
   * @param passions
   * @return {boolean}
   */
  public async addActionScreenCopyToDB(actionScreenData: any[]) {
    try {
      let passionsBulkWriteQuery = [];
      actionScreenData.map((data) => {
        let bulkWriteObject = {
          updateOne: {
            filter: { key: data.key },
            update: {
              $set: {
                key: data.key,
                title: data.title,
                order: data.order,
                week: data.week,
                day: data.day,
                steps: data.steps,
                hoursSaved: data.hoursSaved,
                actionName: data.actionName,
                description: data.description,
                placeHolderText: data.placeHolderText,
                maxCharLimit: data.maxCharLimit,
                isMultiLine: data.isMultiLine,
              },
            },
            upsert: true,
          },
        };
        passionsBulkWriteQuery.push(bulkWriteObject);
      });

      await ActionScreenCopyTable.bulkWrite(passionsBulkWriteQuery);
      return true;
    } catch (error) {
      return error;
    }
  }
  /**
   * @description This function reset the existing users (before v1.28) to use AI-Suggestion onboarding flow
   * @param rows
   * @returns {*}
   */
  public async resetUsersToUseOnboardingFlow(rows: any) {
    let userEmails = [];

    rows.map((item) => {
      if (item["Email"]) {
        userEmails.push(item["Email"]);
      }
    });
    const userData = await UserTable.find({
      email: { $in: userEmails },
    });

    const response = userData.map((user) => user._id);
    const updatedData = await BusinessProfileTable.updateMany(
      { userId: { $in: response } },
      { $set: { description: null } }
    );
    return updatedData;
  }
}

export default new BusinessProfileScriptService();
