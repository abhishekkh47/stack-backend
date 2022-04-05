import Koa from "koa";
import BaseController from "./base";
import { validation } from "../../../validations/apiValidation";
import { Route } from "@app/utility";
import { HttpMethod } from "@app/types";
import { CryptoTable } from "@app/model";
import { Auth } from "@app/middleware";

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
  public async getCrypto(ctx: Koa.Context) {
    const crypto = await CryptoTable.find({}, { name: 1 });
    this.Ok(ctx, { data: crypto, message: "Success" });
  }
}

export default new CryptocurrencyController();
