import { NetworkError } from "@app/middleware";
import { AdminTable, DripshopItemTable, DripshopTable } from "@app/model";
import { CONSTANT, sendEmail } from "@app/utility";
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
    let allItems: any = await DripshopItemTable.find({});
    allItems = allItems.filter((item) => {
      return items.some((x) => x.name === item.name);
    });
    if (allItems.length > 0) {
      throw new NetworkError("Same Items cannot be added", 400);
    }
    const newItem = await DripshopItemTable.insertMany(items);
    return newItem;
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
    };
    const admin = await AdminTable.findOne({});
    await sendEmail(admin.email, CONSTANT.DripShopTemplateId, data);
    return true;
  }
}
export default new DripshopDBService();
