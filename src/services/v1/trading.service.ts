import { ParentChildTable, CryptoTable } from "@app/model";
import {
  createContributions,
  createDisbursements,
  executeQuote,
  generateQuote,
  internalAssetTransfers,
  unlinkBankAccount,
  PLAID_ITEM_ERROR,
} from "@app/utility";
import envData from "@app/config/index";
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
  public async internalTransferAction(
    userId: any,
    childId: any,
    jwtToken: any,
    amount: any = null
  ) {
    /**
     * to get the asset id of crypto
     */
    let crypto = await CryptoTable.findOne({ symbol: "BTC" });

    /**
     * get the account info to get account id
     */
    let getAccountInfo = await ParentChildTable.findOne({
      userId: userId,
    });
    let getAccountId: any =
      getAccountInfo.teens.length > 0
        ? await getAccountInfo.teens.find(
            (x: any) => x.childId.toString() == childId.toString()
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
          "asset-id": crypto.assetId,
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
          "asset-id": crypto.assetId,
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
          "asset-id": crypto.assetId,
          reference: `$${amount} BTC gift from Stack`,
          "hot-transfer": true,
        },
      },
    };
    const internalTransferResponse: any = await internalAssetTransfers(
      jwtToken,
      internalTransferRequest
    );

    if (internalTransferResponse.status == 400) {
      return { giftCardStatus: false };
    }

    return {
      giftCardStatus: true,
      executedQuoteUnitCount:
        executeQuoteResponse.data.data.attributes["unit-count"],
      internalTransferId: internalTransferResponse.data.data.id,
      accountId: getAccountId.accountId,
    };
  }

  /**
   * @description This method is used to unlink bank account
   * @param accessToken
   */
  public async unlinkBankService(accessToken: string) {
    /**
     * plaid utility function to unlink bank
     */
    const unlinkBank: any = await unlinkBankAccount(accessToken);
    if (unlinkBank.status === 400) {
      throw Error("No bank account linked");
    }
    return unlinkBank;
  }
}

export default new TradingService();
