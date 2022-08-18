import { getBalance } from "../utility";
import { CryptoTable, TransactionTable } from "../model";
import { ETransactionType } from "../types";

class getPortfolioService {
  public async getPortfolioBasedOnChildIdWithCurrentMarketPrice(
    childId: string,
    cryptoId: any,
    parentChild: any,
    jwtToken: any
  ) {
    if (!childId) {
      throw Error("Child Id Not Found");
    }
    const accountIdDetails: any = await parentChild.teens.find(
      (x: any) => x.childId.toString() == childId.toString()
    );
    if (!accountIdDetails) {
      throw Error("Account ID Details Not Found");
    }
    const fetchBalance: any = await getBalance(
      jwtToken,
      accountIdDetails.accountId
    );
    if (fetchBalance.status == 400) {
      throw Error(fetchBalance.message);
    }
    const balance = fetchBalance.data.data[0].attributes.disbursable;

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
          balance: balance,
        },
      },
    ]).exec();
    return portFolio.length > 0 ? portFolio[0] : [];
  }

  public async getCryptoIdInPortfolio(childId: string) {
    const portFolio = await TransactionTable.aggregate([
      {
        $match: {
          userId: childId,
          type: { $in: [ETransactionType.BUY, ETransactionType.SELL] },
        },
      },
      {
        $group: {
          _id: "$cryptoId",
          cryptoId: {
            $first: "$cryptoId",
          },
          type: {
            $first: "$type",
          },
          totalSum: {
            $sum: "$unitCount",
          },
          totalAmount: {
            $sum: "$amount",
          },
          totalAmountMod: {
            $sum: "$amountMod",
          },
        },
      },
      {
        $redact: {
          $cond: {
            if: {
              $gt: ["$totalSum", 0],
            },
            then: "$$KEEP",
            else: "$$PRUNE",
          },
        },
      },
      {
        $lookup: {
          from: "cryptos",
          localField: "cryptoId",
          foreignField: "_id",
          as: "cryptoData",
        },
      },
      {
        $unwind: {
          path: "$cryptoData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "cryptoprices",
          localField: "cryptoId",
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
        $addFields: {
          value: {
            $multiply: ["$currentPriceDetails.currentPrice", "$totalSum"],
          },
        },
      },
      {
        $addFields: {
          totalGainLoss: {
            $add: ["$value", "$totalAmountMod"],
          },
        },
      },
      {
        $project: {
          _id: 0,
          cryptoId: 1,
        },
      },
    ]).exec();
    return portFolio.length > 0 ? portFolio : [];
  }
}

export default new getPortfolioService();
