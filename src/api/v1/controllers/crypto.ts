import Koa from "koa";
import BaseController from "./base";
import { validation } from "../../../validations/apiValidation";
import { getAssets, Route } from "../../../utility";
import { HttpMethod } from "../../../types";
import { CryptoPriceTable, CryptoTable } from "../../../model";
import { Auth, PrimeTrustJWT } from "../../../middleware";

class CryptocurrencyController extends BaseController {
  @Route({ path: "/add-crypto", method: HttpMethod.POST })
  @Auth()
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
    return this.Ok(ctx, {
      data: await CryptoTable.find(
        {},
        { name: 1, symbol: 1, assetId: 1, image: 1 }
      ),
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
