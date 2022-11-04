import { PLAID_ITEM_ERROR } from "../utility/constants";
import {
  createContributions,
  createDisbursements,
  generateQuote,
  executeQuote,
  internalAssetTransfers,
} from "../utility";
import { EUserType } from "../types";

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
   * @description This method is used for adding deposit action
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
   * @description This method is used for buy crypto action
   * @param accountIdDetails
   * @param crypto
   * @param jwtToken
   * @param amount
   */
  public async buyCryptoAction(
    accountIdDetails: any,
    crypto: any,
    jwtToken: any,
    amount: any = null
  ) {
    const requestQuoteDay: any = {
      data: {
        type: "quotes",
        attributes: {
          "account-id": accountIdDetails.accountId,
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
      throw new Error(generateQuoteResponse.message);
    }
    /**
     * Execute a quote
     */
    const requestExecuteQuote: any = {
      data: {
        type: "quotes",
        attributes: {
          "account-id": accountIdDetails.accountId,
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
      throw new Error(executeQuoteResponse.message);
    }
    return executeQuoteResponse;
  }

  /**
   * @description This method is used for sell crypto action
   * @param accountIdDetails
   * @param crypto
   * @param jwtToken
   * @param amount
   */
  public async sellCryptoAction(
    accountIdDetails: any,
    crypto: any,
    jwtToken: any,
    amount: any = null
  ) {
    /**
     * Generate a quote
     */
    const requestSellQuoteDay: any = {
      data: {
        type: "quotes",
        attributes: {
          "account-id": accountIdDetails.accountId,
          "asset-id": crypto.assetId,
          hot: true,
          "transaction-type": "sell",
          total_amount: amount,
        },
      },
    };
    const generateSellQuoteResponse: any = await generateQuote(
      jwtToken,
      requestSellQuoteDay
    );
    if (generateSellQuoteResponse.status == 400) {
      throw new Error(generateSellQuoteResponse.message);
    }
    /**
     * Execute a quote
     */
    const requestSellExecuteQuote: any = {
      data: {
        type: "quotes",
        attributes: {
          "account-id": accountIdDetails.accountId,
          "asset-id": crypto.assetId,
        },
      },
    };
    const executeSellQuoteResponse: any = await executeQuote(
      jwtToken,
      generateSellQuoteResponse.data.data.id,
      requestSellExecuteQuote
    );
    if (executeSellQuoteResponse.status == 400) {
      throw new Error(executeSellQuoteResponse.message);
    }
    return executeSellQuoteResponse;
  }

  /**
   * @description This method is used for internal asset transfer
   * @param accountIdDetails
   * @param executeQuoteResponse
   * @param crypto
   * @param jwtToken
   * @param userExists
   */
  public async internalAssetTransfersAction(
    fromAccountId: any,
    executeQuoteResponse: any,
    crypto: any,
    jwtToken: any,
    toAccountId: any
  ) {
    let internalTransferRequest = {
      data: {
        type: "internal-asset-transfers",
        attributes: {
          "unit-count": executeQuoteResponse.data.data.attributes["unit-count"],
          "from-account-id": fromAccountId,
          "to-account-id": toAccountId,
          "asset-id": crypto.assetId,
          reference: "$5 BTC gift from Stack",
          "hot-transfer": true,
        },
      },
    };
    const internalTransferResponse: any = await internalAssetTransfers(
      jwtToken,
      internalTransferRequest
    );
    if (internalTransferResponse.status == 400) {
      throw new Error(internalTransferResponse.message);
    }
    return internalTransferResponse;
  }
}

export default new TradingService();
