import { EAction, EStatus } from "./../types/useractivity";
import { NOTIFICATION } from "./../utility/constants";
import { UserActivityTable } from "./../model/useractivity";
import { ETransactionStatus, ETransactionType } from "./../types/transaction";
import { TransactionTable } from "./../model/transactions";
import {
  generateQuote,
  executeQuote,
  internalAssetTransfers,
} from "./../utility/prime-trust";
import { ParentChildTable } from "./../model/parentChild";
import { ObjectId } from "mongodb";
import { DripShopTable } from "./../model/dripShop";
import envData from "../config/index";
import moment from "moment";

class DripShopService {
  /**
   * @description to get the drip shop info for id
   * @param dripShopId
   */
  public async dripShopInfoForId(dripShopId: any) {
    /**
     * find the info for given dripshop id
     */
    const findDripShopQuery = [
      {
        $match: {
          _id: new ObjectId(dripShopId),
        },
      },
      {
        $lookup: {
          from: "cryptos",
          localField: "cryptoId",
          foreignField: "_id",
          as: "cryptoInfo",
        },
      },
      {
        $unwind: {
          path: "$cryptoInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          cryptoId: 1,
          assetId: 1,
          requiredFuels: 1,
          cryptoToBeRedeemed: 1,
          cryptoName: "$cryptoInfo.name",
        },
      },
    ];

    let findDripShopData: any = await DripShopTable.aggregate(
      findDripShopQuery
    ).exec();

    findDripShopData = findDripShopData.length > 0 ? findDripShopData[0] : [];
    return findDripShopData;
  }

  /**
   * @description to get internal transfer for drip shop
   * @param userId
   * @param dripShopInfo
   * @param jwtToken
   * @param type
   */
  public async internalTransforDripShop(
    userId: any,
    type: number,
    dripShopInfo: any,
    jwtToken: string
  ) {
    /**
     * get the account info to get account id
     */
    let getAccountInfo = await ParentChildTable.findOne({
      $or: [{ userId: userId }, { "teens.childId": userId }],
    });

    let getAccountId: any =
      getAccountInfo.teens.length > 0
        ? await getAccountInfo.teens.find(
            (x: any) => x.childId.toString() == userId.toString()
          )
        : getAccountInfo;

    /**
     * request quote for execution
     */
    const requestQuoteDay: any = {
      data: {
        type: "quotes",
        attributes: {
          "account-id": envData.OPERATIONAL_ACCOUNT,
          "asset-id": dripShopInfo.assetId,
          hot: true,
          "transaction-type": "buy",
          total_amount: 10,
        },
      },
    };
    const generateQuoteResponse: any = await generateQuote(
      jwtToken,
      requestQuoteDay
    );
    if (generateQuoteResponse.status == 400) {
      throw Error(generateQuoteResponse.message);
    }

    /**
     * Execute a quote
     */
    const requestExecuteQuote: any = {
      data: {
        type: "quotes",
        attributes: {
          "account-id": envData.OPERATIONAL_ACCOUNT,
          "asset-id": dripShopInfo.assetId,
        },
      },
    };

    const executeQuoteResponse: any = await executeQuote(
      jwtToken,
      generateQuoteResponse.data.data.id,
      requestExecuteQuote
    );

    if (executeQuoteResponse.status == 400) {
      throw Error(executeQuoteResponse.message);
    }

    /**
     * for internal transfer of BTC
     */
    let internalTransferRequest = {
      data: {
        type: "internal-asset-transfers",
        attributes: {
          "unit-count": executeQuoteResponse.data.data.attributes["unit-count"],
          "from-account-id": envData.OPERATIONAL_ACCOUNT,
          "to-account-id": getAccountId.accountId,
          "asset-id": dripShopInfo.assetId,
          reference: `Redeemed $${10} ${
            dripShopInfo.cryptoName
          } for exchange of fuels`,
          "hot-transfer": true,
        },
      },
    };
    const internalTransferResponse: any = await internalAssetTransfers(
      jwtToken,
      internalTransferRequest
    );

    if (internalTransferResponse.status == 400) {
      throw Error(internalTransferResponse.message);
    }

    /**
     * array containing transaction
     */

    await TransactionTable.create({
      status: ETransactionStatus.SETTLED,
      userId: userId,
      executedQuoteId: internalTransferResponse.data.data.id,
      unitCount: executeQuoteResponse.data.data.attributes["unit-count"],
      accountId: getAccountId.accountId,
      amountMod: -dripShopInfo.cryptoToBeRedeemed,
      amount: dripShopInfo.cryptoToBeRedeemed,
      settledTime: moment().unix(),
      cryptoId: dripShopInfo.cryptoId,
      assetId: dripShopInfo.assetId,
      type: ETransactionType.BUY,
    });

    /**
     * array containing the activity
     */
    await UserActivityTable.create({
      userId: userId,
      userType: type,
      message: NOTIFICATION.DRIP_SHOP_MESSAGE.replace(
        "{cryptoAmount}",
        dripShopInfo.cryptoToBeRedeemed
      )
        .replace("{cryptoName}", dripShopInfo.cryptoName)
        .replace("{fuelAmount}", dripShopInfo.requiredFuels),
      currencyType: null,
      currencyValue: dripShopInfo.cryptoToBeRedeemed,
      action: EAction.BUY_CRYPTO,
      status: EStatus.PROCESSED,
      cryptoId: dripShopInfo.cryptoId,
      assetId: dripShopInfo.assetId,
    });

    return true;
  }
}
export default new DripShopService();
