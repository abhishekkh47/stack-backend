import Koa from "koa";
import BaseController from "./base";
import { validation } from "../../../validations/apiValidation";
import { getAssetTotals, Route } from "../../../utility";
import { ETransactionType, HttpMethod } from "../../../types";
import {
  CryptoPriceTable,
  CryptoTable,
  TransactionTable,
} from "../../../model";
import { Auth, PrimeTrustJWT } from "../../../middleware";
import { ObjectId } from "mongodb";

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
}

export default new CryptocurrencyController();
