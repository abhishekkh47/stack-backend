import Koa from "koa";
import BaseController from "./base";
import { validation } from "../../../validations/apiValidation";
import { getAssets, Route } from "../../../utility";
import { HttpMethod } from "../../../types";
import { CryptoTable } from "../../../model";
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
}

export default new CryptocurrencyController();
