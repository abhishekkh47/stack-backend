import { DripshopTable, ProductTable } from "@app/model";
import { ObjectId } from "mongodb";
import { NetworkError } from "@app/middleware";

class DripshopDBService {
  /**
   * @description get all drip shop data
   */
  public async getDripshopData(usersFuel: number = null) {
    const queryGet = [
      {
        $addFields: {
          isRedeem: {
            $gte: [usersFuel, "$fuel"],
          },
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          image: 1,
          fuel: 1,
          size: 1,
          isRedeem: 1,
          description: 1,
        },
      },
    ];
    let allData = await ProductTable.aggregate(queryGet).exec();

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
   * @param products
   * @returns {*}
   */
  public async addProducts(products: any[]) {
    let allProducts: any = await ProductTable.find({});
    allProducts = allProducts.map((x) => {
      const matchObject = products.find((product) => product.name === x.name);
      return matchObject;
    });
    if (allProducts.length > 0) {
      throw new NetworkError("Same Products cannot be added", 400);
    }
    const newProducts = await ProductTable.insertMany(products);
    return newProducts;
  }
}
export default new DripshopDBService();
