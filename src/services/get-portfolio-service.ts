import { getBalance, createContributions, depositAmount, getMarketValue, getBalanceAlpaca } from "../utility";
import { CryptoTable, TransactionTable, UserActivityTable } from "../model";
import {
  ETransactionType,
  messages,
  EAction,
  EStatus,
  ETransactionStatus,
  EUserType,
} from "../types";
import moment from "moment";
class getPortfolioService {
  public async getPortfolioBasedOnChildIdWithCurrentMarketPrice(
    childId: string,
    cryptoId: any,
    parentChild: any,
    jwtToken: any,
    userExists: any = null
  ) {
    if (!childId) {
      throw Error("Child Id Not Found");
    }
    const accountIdDetails: any =
      userExists && userExists.type == EUserType.SELF
        ? parentChild
        : await parentChild.teens.find(
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

  public async getPortfolioBasedOnChildIdWithCurrentMarketPriceAlpaca(
    childId: string,
    cryptoId: any,
    parentChild: any,
    userExists: any = null
  ) {
    if (!childId) {
      throw Error("Child Id Not Found");
    }
    const accountIdDetails: any =
      userExists && userExists.type == EUserType.SELF
        ? parentChild
        : await parentChild.teens.find(
            (x: any) => x.childId.toString() == childId.toString()
          );
    if (!accountIdDetails) {
      throw Error("Account ID Details Not Found");
    }

    const cryptoSymbol = await CryptoTable.findById({_id: cryptoId})
    const fetchBalance: any = await getBalanceAlpaca(
      accountIdDetails.accountId
    );

    const marketValue: any = await getMarketValue(
      accountIdDetails.accountId,
      cryptoSymbol.symbol
    );

    if(marketValue.status == 400) {
      throw Error(marketValue.message);
    }

    if (fetchBalance.status == 400) {
      throw Error(fetchBalance.message);
    }
    const balance = Number(fetchBalance?.data?.cash);
    const value = Number(marketValue?.data?.market_value);
    const portFolio = await CryptoTable.aggregate([
      {
        $match: {
          _id: cryptoId,
        },
      },
      {
        $addFields: {
          isSell: marketValue?.data?.market_value > 0.00 ? true : false,
          balance: Number(balance),
          currentValue: Number(value),
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

  public async addIntialDeposit(
    reqParam,
    parentDetails,
    jwtToken,
    userExists,
    accountIdDetails
    ) {
      /**
       * create fund transfer with fund transfer id in response
       */
    let contributionRequest = {
      type: "contributions",
      attributes: {
        "account-id":
          userExists.type == EUserType.PARENT
            ? accountIdDetails.accountId
            : accountIdDetails,
        "contact-id": parentDetails.contactId,
        "funds-transfer-method": {
          "funds-transfer-type": "ach",
          "ach-check-type": "personal",
          "contact-id": parentDetails.contactId,
          "plaid-processor-token": parentDetails.processorToken,
        },
        amount: reqParam.depositAmount,
      },
    };
    const contributions: any = await createContributions(
      jwtToken,
      contributionRequest
      );
    if (contributions.status == 400) {
      throw new Error(contributions.message);
    }
    await UserActivityTable.create({
      userId: parentDetails.firstChildId,
      userType: 2,
      message: `${messages.APPROVE_DEPOSIT} $${reqParam.depositAmount}`,
      currencyType: null,
      currencyValue: reqParam.depositAmount,
      action: EAction.DEPOSIT,
      resourceId: contributions.data.included[0].id,
      status: EStatus.PROCESSED,
    });
    await TransactionTable.create({
      assetId: null,
      cryptoId: null,
      intialDeposit: true,
      accountId:
        userExists.type == EUserType.PARENT
          ? accountIdDetails.accountId
          : accountIdDetails,
      type: ETransactionType.DEPOSIT,
      settledTime: moment().unix(),
      amount: reqParam.depositAmount,
      amountMod: null,
      userId: parentDetails.firstChildId,
      parentId: userExists._id,
      status: ETransactionStatus.PENDING,
      executedQuoteId: contributions.data.included[0].id,
      unitCount: null,
    });
  }

  public async addIntialDepositAlpaca(
    reqParam,
    parentDetails,
    bankDetails,
    userExists,
    accountIdDetails
    ) {
      /**
       * create fund transfer with fund transfer id in response
       */

    const deposit: any = await depositAmount(
      bankDetails,
      reqParam.depositAmount,
      accountIdDetails
    );

    await UserActivityTable.create({
      userId: parentDetails.firstChildId,
      userType: userExists.type,
      message: `${messages.APPROVE_DEPOSIT} $${reqParam.depositAmount}`,
      currencyValue: reqParam.depositAmount,
      action: EAction.DEPOSIT,
      status: EStatus.PROCESSED,
    });
    await TransactionTable.create({
      assetId: null,
      cryptoId: null,
      intialDeposit: true,
      accountId:accountIdDetails,
      type: ETransactionType.DEPOSIT,
      settledTime: moment().unix(),
      amount: reqParam.depositAmount,
      amountMod: null,
      userId: parentDetails.firstChildId,
      parentId: userExists._id,
      status: ETransactionStatus.PENDING,
      executedQuoteId: deposit?.data?.id,
      unitCount: null,
    });
  }
}

export default new getPortfolioService();
