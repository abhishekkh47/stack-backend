import Koa from "koa";
import { ObjectId } from "mongodb";
import { Auth, PrimeTrustJWT } from "../../../middleware";
import {
  CryptoPriceTable,
  CryptoTable,
  ParentChildTable,
  TransactionTable,
  UserTable,
} from "../../../model";
import {
  ERECURRING,
  ETransactionType,
  EUserType,
  HttpMethod,
} from "../../../types";
import { Route, getBalance } from "../../../utility";
import { validation } from "../../../validations/apiValidation";
import BaseController from "./base";
import { getPortFolioService } from "../../../services";
import { CASH_USD_ICON } from "../../../utility/constants";

class CryptocurrencyController extends BaseController {
  @Route({ path: "/add-crypto", method: HttpMethod.POST })
  public async addCrypto(ctx: Koa.Context) {
    const input = ctx.request.body;
    return validation.addCryptoInputValidation(
      input,
      ctx,
      async (validate: boolean) => {
        if (validate) {
          try {
            const crypto = await CryptoTable.insertMany(input);
            this.Created(ctx, {
              crypto,
              message: "Crypto added successfully.",
            });
          } catch (error) {
            this.BadRequest(ctx, "Something went wrong. Please try again.");
          }
        }
      }
    );
  }

  @Route({ path: "/get-crypto", method: HttpMethod.GET })
  @Auth()
  public async getCrypto(ctx: any) {
    let query = {};
    if (ctx.request.query.sell && ctx.request.query.sell == "true") {
      if (!ctx.request.query.childId) {
        return this.BadRequest(ctx, "Child Id Details Doesn't Exists");
      }
      let portFolio = await TransactionTable.aggregate([
        {
          $match: {
            userId: new ObjectId(ctx.request.query.childId),
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
      if (portFolio.length > 0) {
        portFolio = await portFolio.map((x) => x.cryptoId);
        query = { _id: { $in: portFolio } };
      } else {
        query = { _id: { $eq: null } };
      }
    }
    return this.Ok(ctx, {
      data: await CryptoTable.find(query, {
        _id: 1,
        name: 1,
        symbol: 1,
        assetId: 1,
        image: 1,
      }),
    });
  }

  @Route({ path: "/get-crypto-prices/:cryptoId", method: HttpMethod.GET })
  @Auth()
  public async getCtyptoPrices(ctx: any) {
    if (
      !ctx.request.params.cryptoId ||
      !/^[0-9a-fA-F]{24}$/.test(ctx.request.params.cryptoId)
    )
      return this.BadRequest(ctx, "Invalid Crypto ID");
    const data = await CryptoPriceTable.findOne(
      { cryptoId: ctx.request.params.cryptoId },
      { _id: 0, createdAt: 0, updatedAt: 0, __v: 0 }
    );
    if (!data) return this.BadRequest(ctx, "Invalid Crypto ID");
    return this.Ok(ctx, { data });
  }

  /**
   * @description This api is used for getting crypto list + cash with their portfolio balance and current price based on childId
   * @param childId
   * @param symbol
   * @returns {*}
   */
  @Route({
    path: "/crypto-info/:childId/:symbol",
    method: HttpMethod.GET,
  })
  @Auth()
  @PrimeTrustJWT()
  public async getCryptoDataWithCurrentPrice(ctx: any) {
    const jwtToken = ctx.request.primeTrustToken;
    const { childId, symbol } = ctx.request.params;
    if (!childId) {
      return this.BadRequest(ctx, "Child Id Doesn't Exists");
    }
    if (!symbol) {
      return this.BadRequest(ctx, "Crypto Id Doesn't Exists");
    }
    const userExists = await UserTable.findOne({ _id: childId });
    const query =
      userExists.type == EUserType.PARENT
        ? { userId: userExists._id }
        : { "teens.childId": userExists._id };
    const parentChild = await ParentChildTable.findOne(query);
    /**
     * For Cash
     */
    if (symbol == "USD") {
      const accountIdDetails: any = await parentChild.teens.find(
        (x: any) => x.childId.toString() == userExists._id.toString()
      );
      if (!parentChild) {
        return this.Ok(ctx, { balance: 0 });
      }
      const fetchBalance: any = await getBalance(
        jwtToken,
        accountIdDetails.accountId
      );
      if (fetchBalance.status == 400) {
        return this.BadRequest(ctx, fetchBalance.message);
      }
      const balance = fetchBalance.data.data[0].attributes.disbursable;
      return this.Ok(ctx, {
        portFolio: {
          value: balance,
          name: "Cash",
          symbol: "USD",
          isRecurring:
            userExists.isRecurring == ERECURRING.WEEKLY ||
            userExists.isRecurring == ERECURRING.MONTLY ||
            userExists.isRecurring == ERECURRING.QUATERLY
              ? userExists.isRecurring
              : parentChild.accessToken
              ? 1
              : 0,
          selectedDeposit: userExists.selectedDeposit,
        },
      });
    }
    /**
     * For Crypto
     */
    const crypto = await CryptoTable.findOne({ symbol: symbol });
    const portFolio =
      await getPortFolioService.getPortfolioBasedOnChildIdWithCurrentMarketPrice(
        userExists._id,
        crypto._id
      );
    // crypto
    return this.Ok(ctx, { message: "Success", portFolio });
  }

  /**
   * @description This api is used for getting crypto list + cash shown in new invest screen
   * @returns {*}
   */
  @Route({ path: "/crypto-list-invest-screen", method: HttpMethod.GET })
  @Auth()
  public async getCryptoInInvestScreen(ctx: any) {
    let cryptoList: any = await CryptoTable.aggregate([
      {
        $project: {
          _id: 1,
          image: 1,
          name: 1,
          symbol: 1,
        },
      },
      {
        $setWindowFields: {
          sortBy: { _id: 1 },
          output: { index: { $documentNumber: {} } },
        },
      },
    ]).exec();
    if (cryptoList.length == 0) {
      return this.BadRequest(ctx, "Crypto Data Not Found");
    }
    cryptoList.unshift({
      image: CASH_USD_ICON,
      name: "Cash",
      symbol: "USD",
      index: 0,
    });
    return this.Ok(ctx, { message: "Success", data: cryptoList });
  }
}

export default new CryptocurrencyController();
