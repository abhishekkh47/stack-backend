import { NetworkError } from "@app/middleware";
import { AdminTable, DripshopItemTable, DripshopTable } from "@app/model";
import { CONSTANT, sendEmail, REWARD_TYPE } from "@app/utility";
import { ObjectId } from "mongodb";

class DripshopDBService {
  /**
   * @description get all drip shop data
   * @param userIfExists
   */
  public async getDripshopData() {
    const queryGet: any = [
      {
        $sort: {
          fuel: 1,
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          image: 1,
          fuel: 1,
          sizes: 1,
          description: 1,
        },
      },
    ];
    let allData = await DripshopItemTable.aggregate(queryGet).exec();

    return allData;
  }

  /**
   * @description to get the drip shop info for id
   * @param dripshopId
   */
  public async dripshopInfoForId(dripshopId: any) {
    /**
     * find the info for given dripshop id
     */
    const queryFindDripshop = [
      {
        $match: {
          _id: new ObjectId(dripshopId),
        },
      },
      {
        $lookup: {
          from: "cryptos",
          localField: "cryptoId",
          foreignField: "_id",
          as: "cryptoInfo",
        },
      },
      {
        $unwind: {
          path: "$cryptoInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          cryptoId: 1,
          assetId: 1,
          requiredFuels: 1,
          cryptoToBeRedeemed: 1,
          cryptoName: "$cryptoInfo.name",
        },
      },
    ];

    let findDripshopData: any = await DripshopTable.aggregate(
      queryFindDripshop
    ).exec();

    findDripshopData = findDripshopData.length > 0 ? findDripshopData[0] : [];
    return findDripshopData;
  }

  /**
   * @description add Dripshop Items
   * @param items
   * @returns {*}
   */
  public async addItems(items: any[]) {
    try {
      const itemDetails = [];
      let bulkWriteObj = {},
        rewardType = 0;
      for (let item of items) {
        if (!item["day"]) break;
        rewardType = REWARD_TYPE[item["rewardType"].trimEnd()];
        const reward = item["rewardValue"].trimEnd();
        bulkWriteObj = {
          updateOne: {
            filter: {
              day: Number(item["day"].trimEnd()),
            },
            update: {
              $set: {
                day: Number(item["day"].trimEnd()),
                name: item["name"].trimEnd(),
                image: item["image"].trimEnd(),
                rewardType,
                reward: rewardType < 3 ? Number(reward) : reward,
                type: 1,
              },
            },
            upsert: true,
          },
        };
        itemDetails.push(bulkWriteObj);
      }
      await DripshopItemTable.bulkWrite(itemDetails);
      return true;
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }

  /**
   * @description send email to admin regarding dripshop items
   * @param dripShopDetails
   * @returns {*}
   */
  public async sendEmailToAdmin(
    dripShopDetails: any,
    userExists: any,
    itemExists: any
  ) {
    /**
     * Send email regarding the details to admin
     */
    const data = {
      firstName: dripShopDetails.firstName,
      lastName: dripShopDetails.lastName,
      email: userExists.email,
      mobile: userExists.mobile,
      address: dripShopDetails.address,
      apartment: dripShopDetails.apartment || "N/A",
      state: dripShopDetails.state,
      city: dripShopDetails.city,
      zipcode: dripShopDetails.zipCode,
      item: itemExists.name,
      selectedsize: dripShopDetails.selectedSize || "N/A",
      subject: "Streak Reward Claimed",
    };
    const admin = await AdminTable.findOne({});
    await sendEmail(admin.email, CONSTANT.DripShopTemplateId, data);
    return true;
  }
}
export default new DripshopDBService();
