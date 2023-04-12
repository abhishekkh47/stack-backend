import { Auth, PrimeTrustJWT } from "@app/middleware";
import { CryptoTable, ParentChildTable, UserTable } from "@app/model";
import { PortfolioService } from "@app/services/v1/index";
import { EUserType, HttpMethod } from "@app/types";
import { getBalance, Route, CASH_USD_ICON } from "@app/utility";
import BaseController from "@app/controllers/base";

class CryptocurrencyController extends BaseController {
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
      userExists.type == EUserType.PARENT || userExists.type == EUserType.SELF
        ? { userId: userExists._id }
        : { "teens.childId": userExists._id };
    const parentChild = await ParentChildTable.findOne(query);
    /**
     * For Cash
     */
    if (symbol == "USD") {
      const accountIdDetails: any =
        userExists.type == EUserType.SELF
          ? parentChild
          : await parentChild.teens.find(
              (x: any) => x.childId.toString() == userExists._id.toString()
            );
      if (!parentChild) {
        return this.Ok(ctx, { balance: 0 });
      }
      let balance = 0;
      if (accountIdDetails.accountId) {
        const fetchBalance: any = await getBalance(
          jwtToken,
          accountIdDetails.accountId
        );
        if (fetchBalance.status == 400) {
          return this.BadRequest(ctx, fetchBalance.message);
        }
        balance = fetchBalance.data.data[0].attributes.disbursable;
      }

      return this.Ok(ctx, {
        portFolio: {
          value: balance,
          balance: balance,
          name: "Cash",
          symbol: "USD",
          image: CASH_USD_ICON,

          isRecurring: userExists.isRecurring,
          selectedDeposit: userExists.selectedDeposit,
        },
      });
    }
    /**
     * For Crypto
     */
    const crypto = await CryptoTable.findOne({ symbol: symbol });
    const portFolio =
      await PortfolioService.getPortfolioBasedOnChildIdWithCurrentMarketPrice(
        userExists._id,
        crypto._id,
        parentChild,
        jwtToken,
        userExists
      );
    // crypto
    return this.Ok(ctx, { message: "Success", portFolio });
  }
}

export default new CryptocurrencyController();
