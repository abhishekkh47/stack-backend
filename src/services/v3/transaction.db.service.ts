import moment from "moment";
import { UserTable } from "../../model/user";
import { TransactionTable } from "../../model";
import { ETransactionType, ETransactionStatus } from "../../types";

class TransactionDBService {
  /**
   * @description create static entry for the user of btc gifted
   */
  public async createBtcGiftedTransaction(
    userId: any,
    cryptInfo: any,
    admin: any
  ) {
    const createTransactionObject = {
      assetId: cryptInfo.assetId,
      cryptoId: cryptInfo._id,
      accountId: null,
      type: ETransactionType.BUY,
      settledTime: moment().unix(),
      amount: admin.giftCryptoAmount,
      amountMod: 0,
      userId: userId,
      parentId: null,
      status: ETransactionStatus.GIFTED,
      executedQuoteId: null,
      unitCount: 0,
    };
    await TransactionTable.create(createTransactionObject);
    await UserTable.updateOne(
      { _id: userId },
      {
        $set: {
          isGiftedCrypto: 1,
          unlockRewardTime: moment().add(admin.rewardHours, "hours").unix(),
        },
      }
    );

    return true;
  }
}

export default new TransactionDBService();
