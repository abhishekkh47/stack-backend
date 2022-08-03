import { CryptoTable } from "../model";
import { ETransactionType } from "../types";

class getPortfolioService {
  public async getPortfolioBasedOnChildIdWithCurrentMarketPrice(
    childId: string,
    cryptoId
  ) {
    if (!childId) {
      throw Error("Child Id Not Found");
    }

    const portFolio = await CryptoTable.aggregate([
      {
        $match: {
          _id: cryptoId,
        },
      },
      {
        $lookup: {
          from: "cryptoprices",
          localField: "_id",
          foreignField: "cryptoId",
          as: "currentPriceDetails",
        },
      },
      {
        $unwind: {
          path: "$currentPriceDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "transactions",
          localField: "_id",
          foreignField: "cryptoId",
          pipeline: [
            {
              $match: {
                userId: childId,
                type: {
                  $in: [ETransactionType.BUY, ETransactionType.SELL],
                },
              },
            },
          ],
          as: "transactionData",
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          symbol: 1,
          image: 1,
          currentPrice: "$currentPriceDetails.currentPrice",
          totalSum: {
            $sum: "$transactionData.unitCount",
          },
          totalAmount: {
            $sum: "$transactionData.amount",
          },
          totalAmountMod: {
            $sum: "$transactionData.amountMod",
          },
          value: {
            $multiply: [
              "$currentPriceDetails.currentPrice",
              {
                $sum: "$transactionData.unitCount",
              },
            ],
          },
        },
      },
      {
        $addFields: {
          isSell: {
            $cond: {
              if: { $eq: ["$value", 0] },
              then: false,
              else: true,
            },
          },
        },
      },
    ]).exec();
    return portFolio.length > 0 ? portFolio[0] : [];
  }
}

export default new getPortfolioService();
