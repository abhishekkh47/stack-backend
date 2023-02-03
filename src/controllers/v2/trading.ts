import { getAccounts, institutionsGetByIdRequest } from "../../utility/plaid";
import {
  NOTIFICATION,
  NOTIFICATION_KEYS,
  PLAID_ITEM_ERROR,
} from "../../utility/constants";
import moment from "moment";
import { EAction, EStatus, messages } from "../../types/useractivity";
import { ObjectId } from "mongodb";
import { UserActivityTable } from "../../model/useractivity";
import envData from "../../config/index";
import { Auth, PrimeTrustJWT } from "../../middleware";
import {
  AdminTable,
  CryptoTable,
  ParentChildTable,
  TransactionTable,
  UserBanksTable,
  UserTable,
} from "../../model";
import {
  DeviceTokenService,
  PortfolioService,
  tradingService,
  userService,
  zohoCrmService,
  TradingDBService,
} from "../../services/v1/index";
import {
  EAUTOAPPROVAL,
  EGIFTSTACKCOINSSETTING,
  ERECURRING,
  ETransactionStatus,
  ETransactionType,
  EUSERSTATUS,
  EUserType,
  HttpMethod,
} from "../../types";
import {
  createBank,
  createProcessorToken,
  executeQuote,
  generateQuote,
  getBalance,
  getPublicTokenExchange,
  internalAssetTransfers,
  Route,
} from "../../utility";
import { PARENT_SIGNUP_FUNNEL } from "../../utility/constants";
import { validation } from "../../validations/v1/apiValidation";
import BaseController from "../base";
import { tradingDBService } from "../../services/v2";

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
          await createBank(
            processToken.data.processor_token,
            publicTokenExchange.data.access_token,
            reqParam.institutionId,
            userExists
          );

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
   * @description This method is used to get child activities processed and pending
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/get-childs-activities", method: HttpMethod.POST })
  @Auth()
  public async getChildsActivities(ctx: any) {
    const { childId, parentId } = ctx.request.body;
    if (!/^[0-9a-fA-F]{24}$/.test(childId))
      return this.BadRequest(ctx, "Enter Correct Child's ID");
    let parent: any = await ParentChildTable.findOne({
      userId: ctx.request.user._id,
    });

    if (!parent) {
      parent = await ParentChildTable.findOne({
        userId: parentId,
      });
    }
    let userExists: any = await UserTable.findOne({ _id: childId });
    if (!parent) return this.BadRequest(ctx, "Invalid Parent's ID");
    let teen: any;
    parent.teens.forEach((current: any) => {
      if (current.childId._id.toString() === childId) {
        teen = current;
      }
    });
    if (!teen) this.BadRequest(ctx, "Invalid Child ID");

    const teenActivities = await UserActivityTable.aggregate([
      {
        $match: {
          userId: new ObjectId(childId),
          status: { $ne: EStatus.CANCELLED_SELF },
        },
      },
      {
        $lookup: {
          from: "cryptos",
          localField: "cryptoId",
          foreignField: "_id",
          as: "crypto",
        },
      },
      {
        $unwind: { path: "$crypto", preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          message: 1,
          userType: 1,
          action: 1,
          status: 1,
          currencyValue: 1,
          cryptoId: 1,
          "crypto._id": 1,
          "crypto.image": 1,
          "crypto.name": 1,
          "crypto.symbol": 1,
          "crypto.assetId": 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
      {
        $sort: { updatedAt: -1 },
      },
    ]).exec();

    const pendingActivity = [];
    const processedActivity = [];
    for (const activity of teenActivities) {
      activity.status === EStatus.PENDING
        ? pendingActivity.push(activity)
        : processedActivity.push(activity);
    }
    return this.Ok(ctx, {
      message: "Success",
      data: {
        pending: pendingActivity,
        processed: processedActivity,
        isAutoApproval: userExists.isAutoApproval,
      },
    });
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
    console.log("----getPortfolio v2----");
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

          const userIdForBankCheck = isTeen
            ? parentChild?.userId?._id
            : childExists?._id;

          let userBankIfExists =
            userIdForBankCheck &&
            (await UserBanksTable.find({
              userId: userIdForBankCheck,
              isDefault: 1,
            }));

          const isParentKycVerified =
            parentChild?.userId?.status === EUSERSTATUS.KYC_DOCUMENT_VERIFIED;

          const userTransactionExists = await TransactionTable.findOne({
            userId: childExists._id,
            intialDeposit: true,
            type: ETransactionType.DEPOSIT,
          });

          const isKidBeforeParent =
            isTeen &&
            (!isParentKycVerified ||
              userBankIfExists.length === 0 ||
              userTransactionExists == null);

          const isSelfWithNoDeposit =
            childExists.type === EUserType.SELF &&
            userTransactionExists == null;

          const buySellTransactions =
            await tradingDBService.getPortfolioTransactions(
              childExists._id,
              isKidBeforeParent,
              cryptoIds ? cryptoIds : [],
              jwtToken,
              primetrustInfo?.accountId,
              isParentKycVerified,
              isSelfWithNoDeposit,
              userTransactionExists
            );

          /**
           * if price didn't change any all, totalStackValue and totalSpentAmount would have been same
           * (if we don't consider cash balance)
           * Note: this totalSpentAmount includes the $5 bonus to the teens
           */

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
          let cashBalance = 0;
          if (primetrustInfo.accountId) {
            const balanceInfo: any = await getBalance(
              jwtToken,
              primetrustInfo.accountId
            );
            if (balanceInfo.status == 400) {
              return this.BadRequest(ctx, balanceInfo.message);
            }
            cashBalance = balanceInfo.data.data[0].attributes.disbursable;
          }

          const pendingInitialDeposit =
            await TradingDBService.getPendingInitialDeposit(childExists._id);
          if (pendingInitialDeposit.length > 0) {
            /**
             * if initial deposit is pending, we add it to totalStackValue
             */
            pendingInitialDepositAmount = pendingInitialDeposit[0].sum;
            totalStackValue = totalStackValue + pendingInitialDeposit[0].sum;
          }
          let hasClearedDeposit = await TransactionTable.findOne({
            userId: childExists._id,
            type: ETransactionType.DEPOSIT,
            status: ETransactionStatus.SETTLED,
          });
          const isKycVerifiedAndDepositCleared =
            isParentKycVerified && hasClearedDeposit;
          totalStackValue =
            totalStackValue +
            (isKycVerifiedAndDepositCleared ? cashBalance : 0);
          return this.Ok(ctx, {
            data: {
              portFolio: buySellTransactions,
              totalStackValue,
              stackCoins: totalCoins,
              totalGainLoss,
              balance: isKycVerifiedAndDepositCleared
                ? cashBalance
                : pendingInitialDepositAmount,
              parentStatus: parentChild?.userId?.status,
              totalAmountInvested:
                totalStackValue - totalGainLoss - (isTeenPending ? 5 : 0),
              intialBalance: pendingInitialDepositAmount,
              /**
               *  0 - SKIP , 1 - PENDIGN 2 - DEPOSIT AVAILNA
               */
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

  /**
   * @description This method is used to add deposit for parent as well as teen
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/add-deposit", method: HttpMethod.POST })
  @Auth()
  @PrimeTrustJWT()
  public async addDepositAction(ctx: any) {
    const user = ctx.request.user;
    const reqParam = ctx.request.body;
    let admin = await AdminTable.findOne({});
    const jwtToken = ctx.request.primeTrustToken;
    const userExists = await UserTable.findOne({ _id: user._id });
    if (!userExists) {
      return this.BadRequest(ctx, "User Not Found");
    }
    const query =
      userExists.type == EUserType.PARENT || userExists.type == EUserType.SELF
        ? reqParam.childId
          ? { "teens.childId": reqParam.childId }
          : { userId: ctx.request.user._id }
        : { "teens.childId": ctx.request.user._id };
    let parentDetails: any = await ParentChildTable.findOne(query);
    if (!parentDetails) return this.BadRequest(ctx, "Invalid User");
    const accountIdDetails =
      userExists.type == EUserType.SELF
        ? parentDetails
        : await parentDetails.teens.find((x: any) =>
            reqParam.childId
              ? x.childId.toString() == reqParam.childId.toString()
              : userExists.type == EUserType.TEEN &&
                userExists.isAutoApproval == EAUTOAPPROVAL.ON
              ? x.childId.toString() == userExists._id.toString()
              : x.childId.toString() == parentDetails.firstChildId.toString()
          );
    if (!accountIdDetails) {
      return this.BadRequest(ctx, "Account Details Not Found");
    }
    return validation.addDepositValidation(
      reqParam,
      ctx,
      userExists.type,
      async (validate) => {
        if (validate) {
          let userBankInfo = await UserBanksTable.findOne({
            _id: reqParam.bankId,
          });
          if (!userBankInfo) {
            return this.BadRequest(ctx, "Bank Details Not Found");
          }
          let contributions: any = null;
          let mainQuery =
            userExists.type == EUserType.PARENT ||
            userExists.type == EUserType.SELF ||
            (userExists.type == EUserType.TEEN &&
              userExists.isAutoApproval == EAUTOAPPROVAL.ON);
          if (mainQuery) {
            contributions = await tradingService.depositAction(
              accountIdDetails,
              parentDetails,
              userBankInfo,
              jwtToken,
              reqParam.amount
            );
          }
          /**
           * For teen it will be pending state
           */
          if (userExists.type === EUserType.TEEN) {
            const activity = await UserActivityTable.create({
              userId: userExists._id,
              userType: userExists.type,
              message:
                userExists.isAutoApproval == EAUTOAPPROVAL.ON
                  ? `${messages.APPROVE_DEPOSIT} $${reqParam.amount}`
                  : `${messages.DEPOSIT} of $${reqParam.amount}`,
              currencyType: null,
              currencyValue: reqParam.amount,
              action: EAction.DEPOSIT,
              status:
                userExists.type === EUserType.TEEN &&
                userExists.isAutoApproval == EAUTOAPPROVAL.OFF
                  ? EStatus.PENDING
                  : EStatus.PROCESSED,
            });
            if (userExists.isAutoApproval == EAUTOAPPROVAL.ON) {
              await TransactionTable.create({
                assetId: null,
                cryptoId: null,
                accountId: accountIdDetails.accountId,
                type: ETransactionType.DEPOSIT,
                settledTime: moment().unix(),
                amount: reqParam.amount,
                amountMod: null,
                userId: accountIdDetails.childId,
                parentId: parentDetails.userId,
                status: ETransactionStatus.PENDING,
                executedQuoteId: contributions.data.included[0].id,
                unitCount: null,
              });
            } else {
              await DeviceTokenService.sendUserNotification(
                parentDetails.userId,
                NOTIFICATION_KEYS.TRADING,
                NOTIFICATION.TEEN_REQUEST_MADE,
                NOTIFICATION.TEEN_REQUEST_ADD_DEPOSIT,
                activity._id
              );
            }

            /*   message:
                     userExists.isAutoApproval == EAUTOAPPROVAL.ON
                     ? `We are looking into your request and will proceed surely in some amount of time.`
                     : `Your request for deposit of $${reqParam.amount} USD has been sent to your parent. Please wait while he/she approves it.`, 
              */

            return this.Created(ctx, {
              message: "Transaction Processed!",
            });
          }

          /**
           * Gift 5$ crypto to teen if deposited first time
           */
          let isInitialDeposit = false;
          if (
            userExists.type === EUserType.PARENT ||
            userExists.type === EUserType.SELF
          ) {
            let childExists = await UserTable.findOne({
              _id: reqParam.childId ? reqParam.childId : userExists._id,
            });

            if (
              childExists &&
              childExists.isGiftedCrypto == EGIFTSTACKCOINSSETTING.ON &&
              admin.giftCryptoSetting == EGIFTSTACKCOINSSETTING.ON
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
                    "to-account-id": accountIdDetails.accountId,
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
                  userId: childExists._id,
                },
                {
                  $set: {
                    unitCount:
                      executeQuoteResponse.data.data.attributes["unit-count"],
                    status: ETransactionStatus.SETTLED,
                    executedQuoteId: internalTransferResponse.data.data.id,
                    accountId: accountIdDetails.accountId,
                  },
                }
              );
              await UserTable.updateOne(
                {
                  _id: childExists._id,
                },
                {
                  $set: {
                    isGiftedCrypto: 2,
                  },
                }
              );

              isInitialDeposit = true;
            }
          }

          await UserActivityTable.create({
            userId: reqParam.childId ? reqParam.childId : userExists._id,
            userType: reqParam.childId ? EUserType.TEEN : userExists.type,
            message: `${messages.APPROVE_DEPOSIT} $${reqParam.amount}`,
            currencyType: null,
            currencyValue: reqParam.amount,
            action: EAction.DEPOSIT,
            resourceId: contributions.data.included[0].id,
            status: EStatus.PROCESSED,
          });

          await TransactionTable.create({
            assetId: null,
            cryptoId: null,
            accountId: accountIdDetails.accountId,
            type: ETransactionType.DEPOSIT,
            settledTime: moment().unix(),
            amount: reqParam.amount,
            amountMod: null,
            userId: accountIdDetails.childId
              ? accountIdDetails.childId
              : userExists._id,
            intialDeposit: isInitialDeposit ? true : false,
            parentId: userExists._id,
            status: ETransactionStatus.PENDING,
            executedQuoteId: contributions.data.included[0].id,
            unitCount: null,
          });

          return this.Created(ctx, {
            message: `Transaction Processed!`,
            data: contributions.data,
          });
        }
      }
    );
  }

  /**
   * @description This method is used for seeing pending activity for teen and parent both
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/pending-activity", method: HttpMethod.POST })
  @Auth()
  public async seePendingActivity(ctx: any) {
    const user = ctx.request.user;
    let userExists = await UserTable.findOne({ _id: user._id });
    if (!userExists) {
      userExists = await UserTable.findOne({ _id: ctx.request.body.userId });
    }
    if (!userExists) {
      return this.BadRequest(ctx, "User not Found");
    }
    let activities = await UserActivityTable.aggregate([
      {
        $match: {
          userId: new ObjectId(user._id),
          status: { $ne: EStatus.CANCELLED_SELF },
        },
      },
      {
        $lookup: {
          from: "cryptos",
          localField: "cryptoId",
          foreignField: "_id",
          as: "crypto",
        },
      },
      {
        $unwind: { path: "$crypto", preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          message: 1,
          userType: 1,
          action: 1,
          status: 1,
          currencyValue: 1,
          cryptoId: 1,
          "crypto._id": 1,
          "crypto.image": 1,
          "crypto.name": 1,
          "crypto.symbol": 1,
          "crypto.assetId": 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
      {
        $sort: { updatedAt: -1 },
      },
    ]).exec();

    if (activities.length === 0) {
      return this.BadRequest(ctx, "No Activity Found");
    }
    const pendingActivity = [];
    const processedActivity = [];
    for await (const activity of activities) {
      activity.status === EStatus.PENDING
        ? await pendingActivity.push(activity)
        : await processedActivity.push(activity);
    }
    return this.Ok(ctx, {
      message: "Success",
      data: { pending: pendingActivity, processed: processedActivity },
    });
  }

  /**
   * @description This method is used to get account details from plaid
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/get-accounts", method: HttpMethod.POST })
  @Auth()
  public async getAccountsFromPlaid(ctx: any) {
    const user = ctx.request.user;
    let userBankExists = await UserBanksTable.findOne({ userId: user._id });
    if (!userBankExists) {
      userBankExists = await UserBanksTable.findOne({
        userId: ctx.request.body.userId,
      });
    }
    if (!userBankExists) {
      return this.BadRequest(ctx, "User Bank Details Not Found");
    }
    let getAccountDetails: any = await getAccounts(userBankExists.accessToken);
    if (getAccountDetails.status == 400) {
      return this.BadRequest(
        ctx,
        getAccountDetails.error_code !== PLAID_ITEM_ERROR
          ? getAccountDetails.messsage
          : PLAID_ITEM_ERROR
      );
    }
    if (userBankExists.insId) {
      const logo: any = await institutionsGetByIdRequest(userBankExists.insId);
      if (logo.status === 200) {
        getAccountDetails.data.accounts.forEach((current) => {
          current.logo = logo.data.institution.logo;
        });
      }
    }
    return this.Ok(ctx, {
      data: getAccountDetails.data.accounts,
      message: "Success",
    });
  }
}

export default new TradingController();
