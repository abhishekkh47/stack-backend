import { NetworkError } from "@app/middleware";
import { UserTable } from "@app/model";

class SubscriptionDBService {
  /**
   * @description add purchased amoutn of tokens/cash to user profile
   * @param userIfExists
   * @param data
   */
  public async addPurchases(userIfExists: any, data: any) {
    // type =>  0- tokens 1 -cash
    const [type, amount] = data;
    let updateObj = {};
    if (type == 0) {
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
    await UserTable.findOneAndUpdate({ userId: userIfExists._id }, updateObj);
  }
}

export default new SubscriptionDBService();
