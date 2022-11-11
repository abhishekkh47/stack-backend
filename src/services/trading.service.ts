import { PLAID_ITEM_ERROR } from "../utility/constants";
import { createContributions, createDisbursements } from "../utility";

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
}

export default new TradingService();
