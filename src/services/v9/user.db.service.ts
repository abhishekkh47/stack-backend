import { UserTable, ProUserTable } from "@app/model";
import { PRO_SUBSCRIPTION_PRICE } from "@app/utility";
import { NetworkError } from "@app/middleware";

class UserDBService {
  /**
   * @description this function will updated the user's pro subscription status
   * @param userIfExists
   * @param subscriptionDetails
   * @returns {*}
   */
  public async updateUserSubscriptionStatus(
    userIfExists: any,
    subscriptionDetails: any
  ) {
    try {
      const activeSubscription =
        subscriptionDetails.customerInfo.entitlements.active.premium;
      let proUserUpdateObj = {
        productId: activeSubscription.productIdentifier,
        subscriptionStartAt: activeSubscription.latestPurchaseDate,
        subscriptionExpireAt: activeSubscription.expirationDate,
        unubscribeAt: activeSubscription.unsubscribeDetectedAt,
        price: PRO_SUBSCRIPTION_PRICE[activeSubscription.productIdentifier],
      };
      await ProUserTable.findOneAndUpdate(
        { userId: userIfExists._id },
        proUserUpdateObj,
        { upsert: true }
      );

      return true;
    } catch (error) {
      throw new NetworkError("INVALID_DESCRIPTION_ERROR", 400);
    }
  }
}
export default new UserDBService();
