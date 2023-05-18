import { getAssetTotalWithId } from "@app/utility";
import { ObjectId } from "mongodb";
import { TransactionTable } from "@app/model";
import { ETransactionType, ETransactionStatus } from "@app/types";

class TradingDBService {
  // pull all the crypto(fiat excluded) transactions from db
  public async getPortfolioTransactions(
    childId: string,
    isKidBeforeParent: boolean,
    cryptoIds: string[],
    jwtToken: string,
    accountId: any,
    isParentKycVerified: boolean,
    isSelfWithNoDeposit: boolean,
    userTransactionExists: any
  ): Promise<any[]> {
    let portfolioArray = [];

    let baseFilter = {
      userId: new ObjectId(childId),
      type: { $in: [ETransactionType.BUY, ETransactionType.SELL] },
    };

    // If parent hasn't completed KYC and bank setup yet, we just show $5 onboarding reward for the teen
    // so we pull it from the transaction table, not from PT cryptoIds.
    const matchRequest =
      isKidBeforeParent || isSelfWithNoDeposit
        ? baseFilter
        : {
            ...baseFilter,
            ...(accountId && { assetId: { $in: cryptoIds } }),
          };

    const portfolioTransactions = await TransactionTable.aggregate([
      {
        $match: matchRequest,
      },
      {
        $group: {
          _id: "$cryptoId",
          status: {
            $first: "$status",
          },
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
            else: {
              $cond: {
                if: {
                  $eq: ["$status", 3],
                },
                then: "$$KEEP",
                else: "$$PRUNE",
              },
            },
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
          _id: 1,
          cryptoId: 1,
          status: 1,
          totalSum: 1,
          type: 1,
          totalAmount: 1,
          totalAmountMod: 1,
          cryptoData: 1,
          currentPrice: "$currentPriceDetails.currentPrice",
          value: {
            $cond: {
              if: {
                $eq: ["$value", 0],
              },
              then: "$totalAmount",
              else: "$value",
            },
          },
          investedValue: { $abs: "$totalAmountMod" },
          totalGainLoss: { $round: ["$totalGainLoss", 2] },
        },
      },
    ]).exec();

    if (isParentKycVerified && userTransactionExists) {
      for await (let cryptoInfo of portfolioTransactions) {
        if (accountId) {
          const getUnitCount: any = await getAssetTotalWithId(
            jwtToken,
            accountId,
            cryptoInfo.cryptoData.assetId
          );

          let unitCount =
            getUnitCount.data.data[0] &&
            getUnitCount.data.data[0]?.attributes?.disbursable > 0
              ? getUnitCount.data.data[0]?.attributes?.disbursable
              : 0;

          if (unitCount > 0) {
            portfolioArray.push({
              ...cryptoInfo,
              value: cryptoInfo.currentPrice * unitCount,
              totalGainLoss:
                cryptoInfo.currentPrice * unitCount + cryptoInfo.totalAmountMod,
            });
          }
        }
      }
    }

    return isParentKycVerified && userTransactionExists
      ? portfolioArray
      : portfolioTransactions;
  }
}

export default new TradingDBService();
