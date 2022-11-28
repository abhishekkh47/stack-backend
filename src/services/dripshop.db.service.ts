import { EAction, EStatus } from "../types/useractivity";
import { NOTIFICATION } from "../utility/constants";
import { UserActivityTable } from "../model/useractivity";
import { ETransactionStatus, ETransactionType } from "../types/transaction";
import { TransactionTable } from "../model/transactions";
import {
  generateQuote,
  executeQuote,
  internalAssetTransfers,
} from "../utility/prime-trust";
import { ParentChildTable } from "../model/parentChild";
import { ObjectId } from "mongodb";
import { DripshopTable } from "../model/dripshop";
import envData from "../config/index";
import moment from "moment";

class DripshopDBService {
  /**
   * @description get all drip shop data
   */
  public async getDripshopQuery() {
    const queryGet = [
      {
        $lookup: {
          from: "cryptos",
          localField: "cryptoId",
          foreignField: "_id",
          as: "cryptoInfo",
        },
      },
      {
        $unwind: { path: "$cryptoInfo", preserveNullAndEmptyArrays: true },
      },
      {
        $redact: {
          $cond: {
            if: {
              $ne: ["$cryptoInfo.disabled", true],
            },
            then: "$$KEEP",
            else: "$$PRUNE",
          },
        },
      },
      {
        $project: {
          cryptoId: 1,
          assetId: 1,
          requiredFuels: 1,
          cryptoToBeRedeemed: 1,
          cryptoName: "$cryptoInfo.name",
          image: { $ifNull: ["$cryptoInfo.image", null] },
        },
      },
    ];
    let allData = await DripshopTable.aggregate(queryGet).exec();

    return allData;
  }

  /**
   * @description to get the drip shop info for id
   * @param dripshopId
   */
  public async dripshopInfoForId(dripshopId: any) {
    /**
     * find the info for given dripshop id
     */
    const queryFindDripshop = [
      {
        $match: {
          _id: new ObjectId(dripshopId),
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

    let findDripshopData: any = await DripshopTable.aggregate(
      queryFindDripshop
    ).exec();

    findDripshopData = findDripshopData.length > 0 ? findDripshopData[0] : [];
    return findDripshopData;
  }

  /**
   * @description to get internal transfer for drip shop
   * @param userId
   * @param dripshopInfo
   * @param jwtToken
   * @param type
   */
  public async internalTransforDripshop(
    userId: any,
    type: number,
    dripshopInfo: any,
    jwtToken: string
  ) {
    const { assetId, cryptoId, requiredFuels, cryptoName, cryptoToBeRedeemed } =
      dripshopInfo;
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
          "asset-id": assetId,
          hot: true,
          "transaction-type": "buy",
          total_amount: cryptoToBeRedeemed,
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
          "asset-id": assetId,
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
          "asset-id": assetId,
          reference: `Redeemed $${10} ${cryptoName} for exchange of fuels`,
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
      amountMod: -cryptoToBeRedeemed,
      amount: cryptoToBeRedeemed,
      settledTime: moment().unix(),
      cryptoId: cryptoId,
      assetId: assetId,
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
        cryptoToBeRedeemed
      )
        .replace("{cryptoName}", cryptoName)
        .replace("{fuelAmount}", requiredFuels),
      currencyType: null,
      currencyValue: cryptoToBeRedeemed,
      action: EAction.BUY_CRYPTO,
      status: EStatus.PROCESSED,
      cryptoId: cryptoId,
      assetId: assetId,
    });

    return true;
  }
}
export default new DripshopDBService();
