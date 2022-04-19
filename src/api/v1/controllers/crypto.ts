import Koa from "koa";
import BaseController from "./base";
import { validation } from "../../../validations/apiValidation";
import { getAssets, Route } from "@app/utility";
import { HttpMethod } from "@app/types";
import { CryptoTable } from "@app/model";
import { Auth, PrimeTrustJWT } from "@app/middleware";

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
  @PrimeTrustJWT()
  @Auth()
  public async getCrypto(ctx: any) {
    const { page, limit } = ctx.request.query;
    const jwtToken = ctx.request.primeTrustToken;
    return validation.getAssetValidation(
      ctx.request.query,
      ctx,
      async (validate: boolean) => {
        if (validate) {
          const getCryptoData: any = await getAssets(jwtToken, page, limit);
          if (getCryptoData.status == 400) {
            return this.BadRequest(ctx, "Asset Not Found");
          }
          return this.Ok(ctx, { message: "Success", data: getCryptoData.data });
        }
      }
    );
  }
}

export default new CryptocurrencyController();
