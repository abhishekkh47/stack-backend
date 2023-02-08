import { ETransactionType } from "./../../types/transaction";
import moment from "moment";
import {
  executeQuote,
  generateQuote,
  internalAssetTransfers,
} from "./../../utility/prime-trust";
import { TransactionTable } from "./../../model/transactions";
import { EGIFTSTACKCOINSSETTING, EUSERSTATUS } from "./../../types/user";
import { Auth, PrimeTrustJWT } from "../../middleware";
import {
  AdminTable,
  CryptoTable,
  ParentChildTable,
  UserTable,
} from "../../model";
import { tradingService, zohoCrmService } from "../../services/v1/index";
import { ETransactionStatus, EUserType, HttpMethod } from "../../types";
import {
  createBank,
  createProcessorToken,
  getPublicTokenExchange,
  Route,
} from "../../utility";
import { PARENT_SIGNUP_FUNNEL } from "../../utility/constants";
import { validation } from "../../validations/v1/apiValidation";
import BaseController from "../base";
import envData from "../../config/index";

class TradingController extends BaseController {
  /**
   * @description This method is used to add bank account in plaid(Link it)
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/add-bank", method: HttpMethod.POST })
  @Auth()
  @PrimeTrustJWT(true)
  public async addBankDetails(ctx: any) {
    const user = ctx.request.user;
    const reqParam = ctx.request.body;
    const jwtToken = ctx.request.primeTrustToken;
    const userExists = await UserTable.findOne({ _id: user._id });
    let admin = await AdminTable.findOne({});
    if (!userExists) {
      return this.BadRequest(ctx, "User Not Found");
    }
    // if (userExists.status !== EUSERSTATUS.KYC_DOCUMENT_VERIFIED) {
    //   return this.BadRequest(ctx, "User Kyc Information not verified");
    // }
    const query =
      userExists.type == EUserType.PARENT || userExists.type == EUserType.SELF
        ? { userId: ctx.request.user._id }
        : { "teens.childId": ctx.request.user._id };
    let parent: any = await ParentChildTable.findOne(query).populate(
      "firstChildId",
      ["email", "isGifted", "isGiftedCrypto", "firstName", "lastName"]
    );
    if (!parent) return this.BadRequest(ctx, "Invalid User");
    return validation.addBankDetailsValidation(
      reqParam,
      ctx,
      async (validate) => {
        if (validate) {
          /**
           * Get public token exchange
           */
          const publicTokenExchange: any = await getPublicTokenExchange(
            reqParam.publicToken
          );
          if (publicTokenExchange.status == 400) {
            return this.BadRequest(ctx, publicTokenExchange.message);
          }
          /**
           * create processor token
           */
          const processToken: any = await createProcessorToken(
            publicTokenExchange.data.access_token,
            reqParam.accountId
          );
          if (processToken.status == 400) {
            return this.BadRequest(ctx, processToken.message);
          }
          const userBankInfo = await createBank(
            processToken.data.processor_token,
            publicTokenExchange.data.access_token,
            reqParam.institutionId,
            userExists
          );

          if (
            userExists.status == EUSERSTATUS.KYC_DOCUMENT_VERIFIED &&
            userBankInfo
          ) {
            let difference = Math.ceil(
              moment
                .duration(
                  moment(moment().valueOf()).diff(
                    moment(userExists.unlockRewardTime)
                  )
                )
                .asMinutes()
            );
            console.log("difference: ", difference);

            if (difference >= 4320) {
              const parentDetails: any = await ParentChildTable.findOne({
                _id: parent._id,
              });
              console.log("parentDetails: ", parentDetails);

              const accountIdDetails =
                userExists.type == EUserType.PARENT
                  ? await parentDetails.teens.find(
                      (x: any) =>
                        x.childId.toString() ==
                        parentDetails.firstChildId.toString()
                    )
                  : parent.accountId;

              console.log("accountIdDetails: ", accountIdDetails);
              if (
                admin.giftCryptoSetting == EGIFTSTACKCOINSSETTING.ON &&
                parent.firstChildId.isGiftedCrypto == EGIFTSTACKCOINSSETTING.ON
              ) {
                let crypto = await CryptoTable.findOne({ symbol: "BTC" });

                let checkTransactionExistsAlready =
                  await TransactionTable.findOne({
                    $or: [
                      { userId: userExists._id },
                      { parentId: userExists._id },
                    ],
                    intialDeposit: true,
                    type: ETransactionType.DEPOSIT,
                  });
                if (checkTransactionExistsAlready) {
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
                    return this.BadRequest(ctx, generateQuoteResponse.message);
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
                    return this.BadRequest(ctx, executeQuoteResponse.message);
                  }
                  let internalTransferRequest = {
                    data: {
                      type: "internal-asset-transfers",
                      attributes: {
                        "unit-count":
                          executeQuoteResponse.data.data.attributes[
                            "unit-count"
                          ],
                        "from-account-id": envData.OPERATIONAL_ACCOUNT,
                        "to-account-id":
                          userExists.type == EUserType.PARENT
                            ? accountIdDetails.accountId
                            : accountIdDetails,
                        "asset-id": crypto.assetId,
                        reference: "$5 BTC gift from Stack",
                        "hot-transfer": true,
                      },
                    },
                  };
                  const internalTransferResponse: any =
                    await internalAssetTransfers(
                      jwtToken,
                      internalTransferRequest
                    );
                  if (internalTransferResponse.status == 400) {
                    return this.BadRequest(
                      ctx,
                      internalTransferResponse.message
                    );
                  }
                  await TransactionTable.updateOne(
                    {
                      status: ETransactionStatus.GIFTED,
                      userId: parent.firstChildId,
                    },
                    {
                      $set: {
                        unitCount:
                          executeQuoteResponse.data.data.attributes[
                            "unit-count"
                          ],
                        status: ETransactionStatus.SETTLED,
                        executedQuoteId: internalTransferResponse.data.data.id,
                        accountId: accountIdDetails.accountId,
                        amountMod: -admin.giftCryptoAmount,
                      },
                    }
                  );
                  await UserTable.updateOne(
                    {
                      _id: parent.firstChildId,
                    },
                    {
                      $set: {
                        isGiftedCrypto: 2,
                      },
                    }
                  );
                }
              }
            }
          }

          /**
           * added bank successfully
           */
          let ParentArray = [
            ...PARENT_SIGNUP_FUNNEL.SIGNUP,
            PARENT_SIGNUP_FUNNEL.DOB,
            PARENT_SIGNUP_FUNNEL.CONFIRM_DETAILS,
            PARENT_SIGNUP_FUNNEL.CHILD_INFO,
            PARENT_SIGNUP_FUNNEL.UPLOAD_DOCUMENT,
            PARENT_SIGNUP_FUNNEL.ADD_BANK,
            PARENT_SIGNUP_FUNNEL.SUCCESS,
          ];
          let dataSentInCrm: any = {
            Account_Name: userExists.firstName + " " + userExists.lastName,
            Email: userExists.email,
            Parent_Signup_Funnel: ParentArray,
            Stack_Coins: admin.stackCoins,
          };
          await zohoCrmService.addAccounts(
            ctx.request.zohoAccessToken,
            dataSentInCrm
          );
          return this.Ok(ctx, { message: "Bank account linked successfully" });
        }
      }
    );
  }
}

export default new TradingController();
