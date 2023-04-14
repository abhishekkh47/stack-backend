import { UserTable } from "./../../model/user";
import { EUserType } from "./../../types/user";
import {
  ETransactionType,
  ETransactionStatus,
} from "./../../types/transaction";
import { TransactionTable } from "./../../model/transactions";
import { CryptoTable } from "../../model/crypto";
import {
  executeQuote,
  generateQuote,
  internalAssetTransfers,
} from "../../utility";
import envData from "../../config/index";
import moment from "moment";
import { PT_REFERENCE_TEXT } from "../../utility/constants";
class TradingService {
  /**
   * @description complete internal transfer action
   * @param userId
   */
  public async internalTransfer(
    parentChildDetails: any,
    jwtToken: any,
    accountIdDetails: any,
    type: any,
    admin: any,
    isParentFirst: boolean
  ) {
    try {
      let crypto = await CryptoTable.findOne({ symbol: "BTC" });

      const checkTransactionExistsAlready = await TransactionTable.findOne({
        userId: isParentFirst
          ? parentChildDetails.childId
          : parentChildDetails.childId._id,
        type: ETransactionType.BUY,
        status: ETransactionStatus.GIFTED,
      });
      if (checkTransactionExistsAlready || isParentFirst) {
        const requestQuoteDay: any = {
          data: {
            type: "quotes",
            attributes: {
              "account-id": envData.OPERATIONAL_ACCOUNT,
              "asset-id": crypto.assetId,
              hot: true,
              "transaction-type": "buy",
              total_amount: "5",
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
          throw Error(executeQuoteResponse.message);
        }
        let internalTransferRequest = {
          data: {
            type: "internal-asset-transfers",
            attributes: {
              "unit-count":
                executeQuoteResponse.data.data.attributes["unit-count"],
              "from-account-id": envData.OPERATIONAL_ACCOUNT,
              "to-account-id":
                type == EUserType.PARENT
                  ? accountIdDetails.accountId
                  : accountIdDetails,
              "asset-id": crypto.assetId,
              reference: PT_REFERENCE_TEXT,
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
        if (isParentFirst) {
          await TransactionTable.create({
            unitCount: executeQuoteResponse.data.data.attributes["unit-count"],
            status: ETransactionStatus.SETTLED,
            executedQuoteId: internalTransferResponse.data.data.id,
            accountId: accountIdDetails.accountId,
            amountMod: -admin.giftCryptoAmount,
            amount: admin.giftCryptoAmount,
            settledTime: moment().unix(),
            userId: parentChildDetails.childId,
            parentId: parentChildDetails.userId,
            cryptoId: crypto._id,
            type: ETransactionType.BUY,
          });
        } else {
          await TransactionTable.updateOne(
            {
              status: ETransactionStatus.GIFTED,
              userId: parentChildDetails.childId._id,
            },
            {
              $set: {
                unitCount:
                  executeQuoteResponse.data.data.attributes["unit-count"],
                status: ETransactionStatus.SETTLED,
                executedQuoteId: internalTransferResponse.data.data.id,
                accountId: accountIdDetails.accountId,
                amountMod: -admin.giftCryptoAmount,
              },
            }
          );
        }
        await UserTable.updateOne(
          {
            _id: isParentFirst
              ? parentChildDetails.childId
              : parentChildDetails.childId._id,
          },
          {
            $set: {
              isGiftedCrypto: 2,
            },
          }
        );

        return true;
      }

      return true;
    } catch (error) {
      return false;
    }
  }
}

export default new TradingService();
