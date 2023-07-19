import { DripshopReedemTable, DripshopItemTable, AdminTable } from "@app/model";
import { ObjectId } from "mongodb";
import { NetworkError } from "@app/middleware";
import { CONSTANT, sendEmail } from "@app/utility";

class DripshopDBService {
  /**
   * @description get all drip shop data
   */
  public async getDripshopData() {
    const queryGet: any = [
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
      {
        $sort: {
          fuel: 1,
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

    let findDripshopData: any = await DripshopReedemTable.aggregate(
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
    allItems = allItems.map((x) => {
      const matchObject = items.find((item) => item.name === x.name);
      return matchObject;
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
