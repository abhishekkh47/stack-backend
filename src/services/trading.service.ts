import { ParentChildTable } from "./../model/parentChild";
import { PLAID_ITEM_ERROR } from "../utility/constants";
import {
  createContributions,
  createDisbursements,
  executeQuote,
  generateQuote,
  internalAssetTransfers,
} from "../utility";
import envData from "../config/index";
class TradingService {
  /**
   * @description This method is used for adding deposit action
   * @param accountIdDetails
   * @param parentDetails
   * @param userBankInfo
   * @param jwtToken
   * @param amount
   */
  public async depositAction(
    accountIdDetails: any,
    parentDetails: any,
    userBankInfo: any,
    jwtToken: any,
    amount: any = null
  ) {
    let contributionRequest = {
      type: "contributions",
      attributes: {
        "account-id": accountIdDetails.accountId,
        "contact-id": parentDetails.contactId,
        "funds-transfer-method": {
          "funds-transfer-type": "ach",
          "ach-check-type": "personal",
          "contact-id": parentDetails.contactId,
          "plaid-processor-token": userBankInfo.processorToken,
        },
        amount: amount,
      },
    };
    let contributions: any = await createContributions(
      jwtToken,
      contributionRequest
    );
    if (contributions.status == 400) {
      throw new Error(
        contributions.code !== 25001
          ? "ERROR: Insufficient Funds"
          : PLAID_ITEM_ERROR
      );
    }
    return contributions;
  }

  /**
   * @description This method is used for adding withdraw action
   * @param accountIdDetails
   * @param parentDetails
   * @param userBankInfo
   * @param jwtToken
   * @param amount
   */
  public async withdrawAction(
    accountIdDetails: any,
    parentDetails: any,
    userBankInfo: any,
    jwtToken: any,
    amount: any = null
  ) {
    /**
     * create fund transfer with fund transfer id in response
     */
    let disbursementRequest = {
      type: "disbursements",
      attributes: {
        "account-id": accountIdDetails.accountId,
        "contact-id": parentDetails.contactId,
        "funds-transfer-method": {
          "funds-transfer-type": "ach",
          "ach-check-type": "personal",
          "contact-id": parentDetails.contactId,
          "plaid-processor-token": userBankInfo.processorToken,
        },
        amount: amount,
      },
    };
    let disbursement: any = await createDisbursements(
      jwtToken,
      disbursementRequest
    );
    if (disbursement.status == 400) {
      throw new Error(
        disbursement.code !== 25001 ? disbursement.message : PLAID_ITEM_ERROR
      );
    }
    return disbursement;
  }

  /**
   * @description This method is used for doing internal transfer for gift card
   * @param accountIdDetails
   * @param jwtToken
   * @param amount
   */
  public async internalDepositAction(
    userId: any,
    childId: any,
    jwtToken: any,
    amount: any = null
  ) {
    console.log("userId: ", userId);
    let getAccountInfo = await ParentChildTable.findOne({
      userId: userId,
    });
    let getAccountId: any =
      getAccountInfo.teens.length > 0
        ? await getAccountInfo.teens.find(
            (x: any) => x.childId.toString() == childId.toString()
          )
        : getAccountInfo;
    console.log("getAccountId: ", getAccountId);

    const requestQuoteDay: any = {
      data: {
        type: "quotes",
        attributes: {
          "account-id": envData.OPERATIONAL_ACCOUNT,
          "asset-id": "798debbc-ec84-43ea-8096-13e2ebcf4749",
          hot: true,
          "transaction-type": "buy",
          total_amount: amount,
        },
      },
    };
    const generateQuoteResponse: any = await generateQuote(
      jwtToken,
      requestQuoteDay
    );
    if (generateQuoteResponse.status == 400) {
      return { giftCardStatus: false };
    }
    /**
     * Execute a quote
     */
    const requestExecuteQuote: any = {
      data: {
        type: "quotes",
        attributes: {
          "account-id": envData.OPERATIONAL_ACCOUNT,
          "asset-id": "798debbc-ec84-43ea-8096-13e2ebcf4749",
        },
      },
    };
    const executeQuoteResponse: any = await executeQuote(
      jwtToken,
      generateQuoteResponse.data.data.id,
      requestExecuteQuote
    );
    if (executeQuoteResponse.status == 400) {
      return { giftCardStatus: false };
    }
    let internalTransferRequest = {
      data: {
        type: "internal-asset-transfers",
        attributes: {
          "unit-count": executeQuoteResponse.data.data.attributes["unit-count"],
          "from-account-id": envData.OPERATIONAL_ACCOUNT,
          "to-account-id": getAccountId.accountId,
          "asset-id": "798debbc-ec84-43ea-8096-13e2ebcf4749",
          reference: `$${amount} BTC gift from Stack`,
          "hot-transfer": true,
        },
      },
    };
    const internalTransferResponse: any = await internalAssetTransfers(
      jwtToken,
      internalTransferRequest
    );

    console.log("internalTransferResponse: ", internalTransferResponse);
    if (internalTransferResponse.status == 400) {
      return { giftCardStatus: false };
    }

    return {
      giftCardStatus: true,
      executedQuoteUnitCount:
        executeQuoteResponse.data.data.attributes["unit-count"],
      internalTransferId: internalTransferResponse.data.data.id,
      accountId: getAccountId.accountId
    };
  }
}

export default new TradingService();
