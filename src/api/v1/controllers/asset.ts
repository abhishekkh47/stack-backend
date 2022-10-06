import { CryptoTable } from "./../../../model/crypto";
import { getAssetCrypto } from "../../../utility/alpaca";
import { Route } from "../../../utility";
import { HttpMethod } from "../../../types";
import BaseController from "./base";
import { Auth } from "@app/middleware";

class AssetController extends BaseController {
  
  /**
   * @description This api is used to get all the crypto asset and post them in the crypto db
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/add-asset-crypto", method: HttpMethod.POST })
  public async addCryptoAction(ctx: any) {
    const response = [];
    const assets: any = await getAssetCrypto();
    await assets.data.map((item: any) => {
      if (item.symbol.split("/")[1] === "USD") {
        response.push(item);
      }
    });
    await response.map(async (response) =>
        await CryptoTable.insertMany({
        name: response.name.split("/")[0].trim(),
        symbol: response.symbol.split("/")[0],
        assetId: response.id,
      })
    );
    this.Created(ctx, {
      message: "Crypto added successfully.",
    });
  }

  /**
   * @description This api is used to get all the crypto from the db
   * @param ctx
   * @returns {*}
   */
  @Route({path: "/get-crypto-list", method: HttpMethod.GET})
  @Auth()
  public async getCryptoListAction(ctx: any) {
    let data = await CryptoTable.find();
    this.Ok(ctx, {
      data,
      message: "Found Crypto List Successfully.",
    });
  }
}

export default new AssetController();
