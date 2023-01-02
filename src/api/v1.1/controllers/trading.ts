import tradingDbService from "../../../services/trading.db.service";
import envData from "../../../config/index";
import { Auth, PrimeTrustJWT } from "../../../middleware";
import {
  AdminTable,
  CryptoTable,
  ParentChildTable,
  TransactionTable,
  UserBanksTable,
  UserTable,
} from "../../../model";
import {
  PortfolioService,
  userService,
  zohoCrmService,
} from "../../../services";
import {
  EGIFTSTACKCOINSSETTING,
  ERECURRING,
  ETransactionStatus,
  ETransactionType,
  EUSERSTATUS,
  EUserType,
  HttpMethod
} from "../../../types";
import {
  createBank,
  createProcessorToken,
  executeQuote,
  generateQuote,
  getBalance,
  getPublicTokenExchange,
  internalAssetTransfers,
  Route,
} from "../../../utility";
import {
  PARENT_SIGNUP_FUNNEL,
} from "../../../utility/constants";
import { validation } from "../../../validations/apiValidation";
import BaseController from "./base";

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
    const userBanksFound = await UserBanksTable.find({ userId: user._id });
    const userExists = await UserTable.findOne({ _id: user._id });
    let admin = await AdminTable.findOne({});
    if (!userExists) {
      return this.BadRequest(ctx, "User Not Found");
    }
    if (userExists.status !== EUSERSTATUS.KYC_DOCUMENT_VERIFIED) {
      return this.BadRequest(ctx, "User Kyc Information not verified");
    }
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
          await createBank(
            processToken.data.processor_token,
            publicTokenExchange.data.access_token,
            reqParam.institutionId,
            userExists
          );
          if (userBanksFound.length > 0) {
            return this.Ok(ctx, {
              message: "Bank account linked successfully",
            });
          }

          // to be commented code need to check once :
          const parentDetails: any = await ParentChildTable.findOne({
            _id: parent._id,
          });
          /**
           * if deposit amount is greater than 0
           */
          if (reqParam.depositAmount && reqParam.depositAmount > 0) {
            let scheduleDate = userService.getScheduleDate(
              reqParam.isRecurring
            );

            await UserTable.updateOne(
              {
                _id: userExists._id,
              },
              {
                $set: {
                  isRecurring: reqParam.isRecurring,
                  selectedDeposit:
                    reqParam.isRecurring == ERECURRING.NO_BANK ||
                    reqParam.isRecurring == ERECURRING.NO_RECURRING
                      ? 0
                      : reqParam.depositAmount,
                  selectedDepositDate:
                    reqParam.isRecurring == ERECURRING.NO_BANK ||
                    reqParam.isRecurring == ERECURRING.NO_RECURRING
                      ? null
                      : scheduleDate,
                },
              }
            );

            const accountIdDetails =
              userExists.type == EUserType.PARENT
                ? await parentDetails.teens.find(
                    (x: any) =>
                      x.childId.toString() ==
                      parentDetails.firstChildId.toString()
                  )
                : parent.accountId;
            await PortfolioService.addIntialDeposit(
              reqParam,
              parentDetails,
              jwtToken,
              userExists,
              accountIdDetails,
              processToken.data.processor_token
            );
            /**
             * Gift Crypto to to teen who had pending 5btc
             */
            if (
              admin.giftCryptoSetting == EGIFTSTACKCOINSSETTING.ON &&
              parent.firstChildId.isGiftedCrypto == EGIFTSTACKCOINSSETTING.ON
            ) {
              let crypto = await CryptoTable.findOne({ symbol: "BTC" });
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
                      executeQuoteResponse.data.data.attributes["unit-count"],
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
                await internalAssetTransfers(jwtToken, internalTransferRequest);
              if (internalTransferResponse.status == 400) {
                return this.BadRequest(ctx, internalTransferResponse.message);
              }
              await TransactionTable.updateOne(
                {
                  status: ETransactionStatus.GIFTED,
                  userId: parent.firstChildId,
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
            /**
             * added bank successfully
             */
            let ParentArray = [
              ...PARENT_SIGNUP_FUNNEL.SIGNUP,
              PARENT_SIGNUP_FUNNEL.DOB,
              PARENT_SIGNUP_FUNNEL.MOBILE_NUMBER,
              PARENT_SIGNUP_FUNNEL.CHILD_INFO,
              PARENT_SIGNUP_FUNNEL.CONFIRM_DETAILS,
              PARENT_SIGNUP_FUNNEL.ADD_BANK,
              PARENT_SIGNUP_FUNNEL.FUND_ACCOUNT,
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
            return this.Ok(ctx, {
              message:
                "We will proceed your request surely in some amount of time.",
            });
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

  /**
   * @description This method is used to get portfolio for child account
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/get-portfolio/:childId", method: HttpMethod.GET })
  @Auth()
  @PrimeTrustJWT()
  public async getPortfolio(ctx: any) {
    const jwtToken = ctx.request.primeTrustToken;
    const reqParam = ctx.request.params;
    return validation.getPortFolioValidation(
      reqParam,
      ctx,
      async (validate) => {
        if (validate) {
          const childExists: any = await UserTable.findOne({
            _id: reqParam.childId,
          });

          if (!childExists) {
            return this.BadRequest(ctx, "User Not Found");
          }

          if (childExists.type == EUserType.PARENT) {
            return this.BadRequest(ctx, "Should be SELF or TEEN");
          }

          let parentChild;
          let isTeenPending = false;
          const isTeen = childExists.type === EUserType.TEEN;

          if (isTeen) {
            parentChild = await ParentChildTable.findOne({
              "teens.childId": childExists._id,
            }).populate("userId", ["_id", "quizCoins", "status"]);
            if (parentChild && childExists.isParentFirst == true) {
              isTeenPending = true;
            }
          } else {
            parentChild = await ParentChildTable.findOne({
              userId: childExists._id,
            }).populate("userId", ["_id", "quizCoins", "status"]);
          }

          const primetrustInfo = !isTeen
            ? parentChild
            : parentChild?.teens?.find(
                (x) => x.childId.toString() == reqParam.childId
              );

          const cryptoIds =
            primetrustInfo?.accountId &&
            (await PortfolioService.getRecentPricePorfolio(
              jwtToken,
              primetrustInfo.accountId
            ));

          let userBankIfExists =
            parentChild &&
            (await UserBanksTable.find({
              userId: isTeen ? parentChild.userId._id : childExists._id,
              isDefault: 1,
            }));

          const isParentKycVerified =
            parentChild?.userId?.status === EUSERSTATUS.KYC_DOCUMENT_VERIFIED;
          const isKidBeforeParent =
            isTeen && (!isParentKycVerified || userBankIfExists.length === 0);

          const buySellTransactions =
            await tradingDbService.getPortfolioTransactions(
              childExists._id,
              isKidBeforeParent,
              cryptoIds,
              jwtToken,
              primetrustInfo?.accountId,
              isParentKycVerified
            );

          // if price didn't change any all, totalStackValue and totalSpentAmount would have been same
          // (if we don't consider cash balance)
          // Note: this totalSpentAmount includes the $5 bonus to the teens
          let totalStackValue: any = 0;
          let totalSpentAmount = 0;
          let totalGainLoss: any = 0;
          let pendingInitialDepositAmount = 0;
          if (buySellTransactions.length > 0) {
            buySellTransactions.forEach((data) => {
              totalStackValue = parseFloat(
                parseFloat(totalStackValue + data.value).toFixed(2)
              );
              totalSpentAmount = parseFloat(
                parseFloat(data.totalAmount).toFixed(2)
              );
              totalGainLoss = parseFloat(
                parseFloat(totalGainLoss + data.totalGainLoss).toFixed(2)
              );
            });
          }

          const myOwnCoins = childExists.quizCoins + childExists.preLoadedCoins;
          const totalCoins = isTeen
            ? (parentChild?.userId?.quizCoins || 0) + myOwnCoins
            : myOwnCoins;

          if (isTeen && !isParentKycVerified) {
            return this.Ok(ctx, {
              data: {
                portFolio: buySellTransactions || [],
                totalStackValue,
                stackCoins: totalCoins,
                totalGainLoss,
                balance: 0,
                parentStatus: null,
                totalAmountInvested: totalSpentAmount,
                intialBalance: 0,
                isDeposit: 0,
                isTeenPending,
              },
            });
          }

          if (!primetrustInfo) {
            return this.BadRequest(ctx, "Account Details Not Found");
          }
          /**
           * Fetch Cash Balance
           */
          const balanceInfo: any = await getBalance(
            jwtToken,
            primetrustInfo.accountId
          );
          if (balanceInfo.status == 400) {
            return this.BadRequest(ctx, balanceInfo.message);
          }
          const cashBalance = balanceInfo.data.data[0].attributes.disbursable;

          const pendingInitialDeposit =
            await tradingDbService.getPendingInitialDeposit(childExists._id);
          if (pendingInitialDeposit.length > 0) {
            // if initial deposit is pending, we add it to totalStackValue
            pendingInitialDepositAmount = pendingInitialDeposit[0].sum;
            totalStackValue = totalStackValue + pendingInitialDeposit[0].sum;
          }
          let hasClearedDeposit = await TransactionTable.findOne({
            userId: childExists._id,
            type: ETransactionType.DEPOSIT,
            status: ETransactionStatus.SETTLED,
          });
          const isKycVerifiedAndDepositCleared = isParentKycVerified && hasClearedDeposit
          totalStackValue = totalStackValue + (isKycVerifiedAndDepositCleared ? cashBalance : 0);
          return this.Ok(ctx, {
            data: {
              portFolio: buySellTransactions,
              totalStackValue,
              stackCoins: totalCoins,
              totalGainLoss,
              balance: isKycVerifiedAndDepositCleared ? cashBalance : pendingInitialDepositAmount,
              parentStatus: parentChild?.userId?.status,
              totalAmountInvested:
                totalStackValue - totalGainLoss - (isTeenPending ? 5 : 0),
              intialBalance: pendingInitialDepositAmount,
              // 0 - SKIP , 1 - PENDIGN 2 - DEPOSIT AVAILNA
              isDeposit: isParentKycVerified
                ? hasClearedDeposit
                  ? 2
                  : pendingInitialDeposit.length > 0
                  ? 1
                  : 0
                : 0,
              isTeenPending,
            },
          });
        }
      }
    );
  }
}

export default new TradingController();
