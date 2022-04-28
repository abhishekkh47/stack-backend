import { ParentChildTable } from "@app/model";
import { ObjectId } from "mongodb";

export const getAccountId = async (userId: any) => {
  let accountId: any = null;
  let user = await ParentChildTable.findOne({ userId: new ObjectId(userId) });
  if (user) {
    accountId = (
      await ParentChildTable.aggregate([
        {
          $match: { userId: new ObjectId(userId) },
        },
        {
          $addFields: {
            firstChildData: {
              $filter: {
                input: "$teens",
                as: "teen",
                cond: { $eq: ["$$teen.childId", "$firstChildId"] },
              },
            },
          },
        },
        {
          $project: { _id: 0, firstChildData: 1 },
        },
      ]).exec()
    )[0].firstChildData[0].accountId;
    return accountId;
  }

  accountId = (
    await ParentChildTable.findOne(
      { "teens.childId": new ObjectId(userId) },
      { "teens.$": 1, _id: 0 }
    )
  ).teens;
  accountId = accountId[0].accountId;
  return accountId;
};
