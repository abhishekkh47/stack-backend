import { NetworkError } from "@app/middleware";
import { UserTable } from "@app/model";
import { PURCHASE_TYPE } from "@app/utility";

class SubscriptionDBService {
  /**
   * @description add purchased amoutn of tokens/cash to user profile
   * @param userIfExists
   * @param data
   */
  public async addPurchases(userIfExists: any, data: any) {
    try {
      const { type, amount } = data;
      let updateObj = {};
      if (type == PURCHASE_TYPE.TOKEN) {
        updateObj = {
          $inc: {
            quizCoins: amount,
          },
        };
      } else {
        updateObj = {
          $inc: {
            cash: amount,
          },
        };
      }
      await UserTable.findOneAndUpdate({ _id: userIfExists._id }, updateObj);
    } catch (error) {
      throw new NetworkError(
        "Error occurred while completing your purchase request",
        400
      );
    }
  }
}

export default new SubscriptionDBService();
