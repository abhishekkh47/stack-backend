import moment from "moment";
import { Admin, ObjectId } from "mongodb";
import Koa from "koa";
import {
  createContributions,
  createDisbursements,
  createProcessorToken,
  getPublicTokenExchange,
  getBalance,
  Route,
  generateQuote,
  executeQuote,
  getAccountId,
  getWireTransfer,
  getContactId,
  wireTransfer,
  getPushTransferMethods,
  sendNotification,
  getAccounts,
  institutionsGetByIdRequest,
  addAccountInfoInZohoCrm,
  internalAssetTransfers,
} from "../../../utility";
import mongoose from "mongoose";
import { Auth, PrimeTrustJWT } from "../../../middleware";
import {
  AdminTable,
  CryptoTable,
  DeviceToken,
  Notification,
  ParentChildTable,
  QuizResult,
  TransactionTable,
  UserActivityTable,
  UserTable,
} from "../../../model";
import {
  EAction,
  EAUTOAPPROVAL,
  EGIFTSTACKCOINSSETTING,
  ERead,
  ESCREENSTATUS,
  EStatus,
  ETransactionStatus,
  ETransactionType,
  EUSERSTATUS,
  EUserType,
  HttpMethod,
  messages,
} from "../../../types";
import {
  NOTIFICATION,
  NOTIFICATION_KEYS,
  PARENT_SIGNUP_FUNNEL,
} from "../../../utility/constants";
import { validation } from "../../../validations/apiValidation";
import BaseController from "./base";
import envData from "../../../config/index";

class TradingController extends BaseController {
  /**
   * @description This method is used to add bank account in plaid(Link it)
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/add-bank", method: HttpMethod.POST })
  @PrimeTrustJWT()
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
    if (userExists.status !== EUSERSTATUS.KYC_DOCUMENT_VERIFIED) {
      return this.BadRequest(ctx, "User Kyc Information not verified");
    }
    const query =
      userExists.type == EUserType.PARENT
        ? { userId: ctx.request.user._id }
        : { "teens.childId": ctx.request.user._id };
    let parent: any = await ParentChildTable.findOne(query).populate(
      "firstChildId",
      ["email", "isGifted", "isGiftedCrypto", "firstName", "lastName"]
    );
    if (!parent) return this.BadRequest(ctx, "Invalid User");
    if (parent.accessToken || parent.processorToken) {
      return this.BadRequest(ctx, "Bank Details Already Updated");
    }
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
          const parentDetails: any = await ParentChildTable.findOneAndUpdate(
            {
              _id: parent._id,
            },
            {
              $set: {
                processorToken: processToken.data.processor_token,
                accessToken: publicTokenExchange.data.access_token,
                institutionId: reqParam.institutionId,
              },
            },
            { new: true }
          );
          await UserTable.updateOne(
            {
              _id: userExists._id,
            },
            {
              $set: {
                screenStatus: ESCREENSTATUS.SUCCESS,
              },
            }
          );
          /**
           * if deposit amount is greater than 0
           */
          if (reqParam.depositAmount && reqParam.depositAmount > 0) {
            const accountIdDetails = await parentDetails.teens.find(
              (x: any) =>
                x.childId.toString() == parentDetails.firstChildId.toString()
            );
            /**
             * create fund transfer with fund transfer id in response
             */
            let contributionRequest = {
              type: "contributions",
              attributes: {
                "account-id": accountIdDetails.accountId,
                "contact-id": parentDetails.contactId,
                "funds-transfer-method": {
                  "funds-transfer-type": "ach",
                  "ach-check-type": "personal",
                  "contact-id": parentDetails.contactId,
                  "plaid-processor-token": parentDetails.processorToken,
                },
                amount: reqParam.depositAmount,
              },
            };
            const contributions: any = await createContributions(
              jwtToken,
              contributionRequest
            );
            if (contributions.status == 400) {
              return this.BadRequest(ctx, contributions.message);
            }
            await UserActivityTable.create({
              userId: userExists._id,
              userType: 2,
              message: `${messages.APPROVE_DEPOSIT} $${reqParam.depositAmount}`,
              currencyType: null,
              currencyValue: reqParam.depositAmount,
              action: EAction.DEPOSIT,
              resourceId: contributions.data.included[0].id,
              status: EStatus.PROCESSED,
            });
            await TransactionTable.create({
              assetId: null,
              cryptoId: null,
              intialDeposit: true,
              accountId: accountIdDetails.accountId,
              type: ETransactionType.DEPOSIT,
              settledTime: moment().unix(),
              amount: reqParam.depositAmount,
              amountMod: null,
              userId: parentDetails.firstChildId,
              parentId: userExists._id,
              status: ETransactionStatus.PENDING,
              executedQuoteId: contributions.data.included[0].id,
              unitCount: null,
            });
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
            return this.Ok(ctx, {
              message:
                "We will proceed your request surely in some amount of time.",
            });
          }
          /**
           * added bank successfully
           */
          let dataSentInCrm: any = {
            Account_Name: userExists.firstName + " " + userExists.lastName,
            Parent_Signup_Funnel: [
              ...PARENT_SIGNUP_FUNNEL.SIGNUP,
              PARENT_SIGNUP_FUNNEL.ADDRESS,
              PARENT_SIGNUP_FUNNEL.UPLOAD_DOCUMENT,
              PARENT_SIGNUP_FUNNEL.ADD_BANK,
              PARENT_SIGNUP_FUNNEL.SUCCESS,
            ],
          };
          let mainData = {
            data: [dataSentInCrm],
          };
          await addAccountInfoInZohoCrm(ctx.request.zohoAccessToken, mainData);
          return this.Ok(ctx, { message: "Bank account linked successfully" });
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
      userExists.type == EUserType.PARENT
        ? reqParam.childId
          ? { "teens.childId": reqParam.childId }
          : { userId: ctx.request.user._id }
        : { "teens.childId": ctx.request.user._id };
    let parentDetails: any = await ParentChildTable.findOne(query);
    if (!parentDetails) return this.BadRequest(ctx, "Invalid User");
    const accountIdDetails = await parentDetails.teens.find((x: any) =>
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
          let contributions: any = null;
          if (
            userExists.type == EUserType.PARENT ||
            (userExists.type == EUserType.TEEN &&
              userExists.isAutoApproval == EAUTOAPPROVAL.ON)
          ) {
            /**
             * create fund transfer with fund transfer id in response
             */
            let contributionRequest = {
              type: "contributions",
              attributes: {
                "account-id": accountIdDetails.accountId,
                "contact-id": parentDetails.contactId,
                "funds-transfer-method": {
                  "funds-transfer-type": "ach",
                  "ach-check-type": "personal",
                  "contact-id": parentDetails.contactId,
                  "plaid-processor-token": parentDetails.processorToken,
                },
                amount: reqParam.amount,
              },
            };
            contributions = await createContributions(
              jwtToken,
              contributionRequest
            );
            if (contributions.status == 400) {
              return this.BadRequest(ctx, contributions.message);
            }
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
              let deviceTokenData = await DeviceToken.findOne({
                userId: parentDetails.userId,
              }).select("deviceToken");
              if (deviceTokenData) {
                let notificationRequest = {
                  key: NOTIFICATION_KEYS.TRADING,
                  title: NOTIFICATION.TEEN_REQUEST_MADE,
                  message: NOTIFICATION.TEEN_REQUEST_ADD_DEPOSIT,
                  activityId: activity._id,
                };
                await sendNotification(
                  deviceTokenData.deviceToken,
                  notificationRequest.title,
                  notificationRequest
                );
                await Notification.create({
                  title: notificationRequest.title,
                  userId: parentDetails.userId,
                  message: notificationRequest.message,
                  isRead: ERead.UNREAD,
                  data: JSON.stringify(notificationRequest),
                });
              }
            }
            return this.Created(ctx, {
              message:
                userExists.isAutoApproval == EAUTOAPPROVAL.ON
                  ? `We are looking into your request and will proceed surely in some amount of time.`
                  : `Your request for deposit of $${reqParam.amount} USD has been sent to your parent. Please wait while he/she approves it.`,
            });
          }

          /**
           * Gift 5$ crypto to teen if deposited first time
           */
          if (userExists.type === EUserType.PARENT) {
            let childExists = await UserTable.findOne({
              _id: reqParam.childId,
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
            userId: accountIdDetails.childId,
            parentId: userExists._id,
            status: ETransactionStatus.PENDING,
            executedQuoteId: contributions.data.included[0].id,
            unitCount: null,
          });
          return this.Created(ctx, {
            message: `We are looking into your request and will proceed surely in some amount of time.`,
            data: contributions.data,
          });

          // else if (reqParam.depositType == ETRANSFER.WIRE) {
          //   /**
          //    * Check if push transfer exists and move ahead else create
          //    */
          //   let pushTransferId = accountIdDetails.pushTransferId
          //     ? accountIdDetails.pushTransferId
          //     : null;
          //   if (accountIdDetails.pushTransferId == null) {
          //     const pushTransferRequest = {
          //       type: "push-transfer-methods",
          //       attributes: {
          //         "account-id": accountIdDetails.accountId,
          //         "contact-id": parentDetails.contactId,
          //       },
          //     };
          //     const pushTransferResponse: any = await createPushTransferMethod(
          //       jwtToken,
          //       pushTransferRequest
          //     );
          //     if (pushTransferResponse.status == 400) {
          //       return this.BadRequest(ctx, pushTransferResponse.message);
          //     }
          //     pushTransferId = pushTransferResponse.data.id;
          //     await ParentChildTable.updateOne(
          //       {
          //         userId: userExists._id,
          //         "teens.childId": parentDetails.firstChildId,
          //       },
          //       {
          //         $set: {
          //           "teens.$.pushTransferId": pushTransferId,
          //         },
          //       }
          //     );
          //   }
          //   /**
          //    * Create a wire transfer method respectively
          //    */
          //   // const wireRequest = {
          //   //   "push-transfer-method-id": pushTransferId,
          //   //   data: {
          //   //     type: "ach",
          //   //     attributes: {
          //   //       amount: reqParam.amount,
          //   //       reference: reqParam.amount,
          //   //     },
          //   //   },
          //   // };
          //   // const wireResponse: any = await wireInboundMethod(
          //   //   jwtToken,
          //   //   wireRequest,
          //   //   pushTransferId
          //   // );
          //   // if (wireResponse.status == 400) {
          //   //   return this.BadRequest(ctx, wireResponse.message);
          //   // }

          //   /**
          //    * For parent update the user balance directly
          //    */
          //   if (userExists.type === EUserType.PARENT) {
          //     return this.Created(ctx, {
          //       message:
          //         "We are looking into your request and will proceed surely in some amount of time.",
          //     });
          //   }
          // }
        }
      }
    );
  }

  /**
   * @description This method is used to withdraw money for for parent as well as for tenn
   * @param ctx
   * @returns
   */
  @Route({ path: "/withdraw-money", method: HttpMethod.POST })
  @Auth()
  @PrimeTrustJWT()
  public async withdrawMoney(ctx: any) {
    const user = ctx.request.user;
    const reqParam = ctx.request.body;
    const jwtToken = ctx.request.primeTrustToken;
    const userExists = await UserTable.findOne({ _id: user._id });
    if (!userExists) {
      return this.BadRequest(ctx, "User Not Found");
    }
    return validation.withdrawMoneyValidation(
      reqParam,
      ctx,
      userExists.type,
      async (validate) => {
        if (validate) {
          /**
           * Check current balance is greather than withdrawable amount
           */
          const query =
            userExists.type == EUserType.PARENT
              ? reqParam.childId
                ? { "teens.childId": reqParam.childId }
                : { userId: ctx.request.user._id }
              : { "teens.childId": ctx.request.user._id };
          let parentDetails: any = await ParentChildTable.findOne(query);
          if (!parentDetails) return this.BadRequest(ctx, "Invalid User");
          const accountIdDetails = await parentDetails.teens.find((x: any) =>
            userExists.type == EUserType.PARENT
              ? reqParam.childId
                ? x.childId.toString() == reqParam.childId.toString()
                : x.childId.toString() == parentDetails.firstChildId.toString()
              : x.childId.toString() == ctx.request.user._id.toString()
          );
          if (!accountIdDetails) {
            return this.BadRequest(ctx, "Account Details Not Found");
          }
          const fetchBalance: any = await getBalance(
            jwtToken,
            accountIdDetails.accountId
          );
          if (fetchBalance.status == 400) {
            return this.BadRequest(ctx, fetchBalance.message);
          }
          const balance = fetchBalance.data.data[0].attributes.disbursable;
          if (balance < reqParam.amount) {
            return this.BadRequest(
              ctx,
              "You dont have sufficient balance to withdraw money"
            );
          }
          const checkUserActivityForWithdraw =
            await UserActivityTable.aggregate([
              {
                $match: {
                  userId: userExists._id,
                  action: EAction.WITHDRAW,
                  status: EStatus.PENDING,
                },
              },
              {
                $group: {
                  _id: null,
                  total: {
                    $sum: "$currencyValue",
                  },
                },
              },
            ]).exec();
          if (checkUserActivityForWithdraw.length > 0) {
            if (
              balance <
              checkUserActivityForWithdraw[0].total + reqParam.amount
            ) {
              return this.BadRequest(
                ctx,
                "Please cancel your existing request in order to withdraw money from this request"
              );
            }
          }
          let disbursement: any = null;
          if (
            userExists.type == EUserType.PARENT ||
            (userExists.type == EUserType.TEEN &&
              userExists.isAutoApproval == EAUTOAPPROVAL.ON)
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
                  "plaid-processor-token": parentDetails.processorToken,
                },
                amount: reqParam.amount,
              },
            };
            disbursement = await createDisbursements(
              jwtToken,
              disbursementRequest
            );
            if (disbursement.status == 400) {
              return this.BadRequest(ctx, disbursement.message);
            }
          }
          /**
           * for teen it will be pending state and for parent it will be in approved
           */
          if (userExists.type == EUserType.TEEN) {
            const activity = await UserActivityTable.create({
              userId: userExists._id,
              userType: userExists.type,
              message:
                userExists.isAutoApproval == EAUTOAPPROVAL.ON
                  ? `${messages.APPROVE_WITHDRAW} $${reqParam.amount}`
                  : `${messages.WITHDRAW} of $${reqParam.amount}`,
              currencyType: null,
              currencyValue: reqParam.amount,
              action: EAction.WITHDRAW,
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
                type: ETransactionType.WITHDRAW,
                settledTime: moment().unix(),
                amount: reqParam.amount,
                amountMod: null,
                userId: accountIdDetails.childId,
                parentId: parentDetails.userId,
                status: ETransactionStatus.PENDING,
                executedQuoteId: disbursement.data.included[0].id,
                unitCount: null,
              });
            } else {
              let deviceTokenData = await DeviceToken.findOne({
                userId: parentDetails.userId,
              }).select("deviceToken");
              /**
               * Notification
               */
              if (deviceTokenData) {
                let notificationRequest = {
                  key: NOTIFICATION_KEYS.TRADING,
                  title: NOTIFICATION.TEEN_REQUEST_MADE,
                  message: NOTIFICATION.TEEN_REQUEST_ADD_WITHDRAW,
                  activityId: activity._id,
                };
                await sendNotification(
                  deviceTokenData.deviceToken,
                  notificationRequest.title,
                  notificationRequest
                );
                await Notification.create({
                  title: notificationRequest.title,
                  userId: parentDetails.userId,
                  message: notificationRequest.message,
                  isRead: ERead.UNREAD,
                  data: JSON.stringify(notificationRequest),
                });
              }
            }
            return this.Created(ctx, {
              message:
                userExists.isAutoApproval == EAUTOAPPROVAL.ON
                  ? `"We are looking into your request and will proceed surely in some amount of time."`
                  : `Your request for withdrawal of $${reqParam.amount} USD has been sent to your parent. Please wait while he/she approves it`,
            });
          }
          /**
           * For parent create disbursement code of prime trust with plaid processor token
           */
          if (userExists.type === EUserType.PARENT) {
            await UserActivityTable.create({
              userId: reqParam.childId ? reqParam.childId : userExists._id,
              userType: reqParam.childId ? EUserType.TEEN : userExists.type,
              message: `${messages.APPROVE_WITHDRAW} $${reqParam.amount}`,
              currencyType: null,
              currencyValue: reqParam.amount,
              action: EAction.WITHDRAW,
              status: EStatus.PROCESSED,
            });
            await TransactionTable.create({
              assetId: null,
              cryptoId: null,
              accountId: accountIdDetails.accountId,
              type: ETransactionType.WITHDRAW,
              settledTime: moment().unix(),
              amount: reqParam.amount,
              amountMod: null,
              userId: accountIdDetails.childId,
              parentId: userExists._id,
              status: ETransactionStatus.PENDING,
              executedQuoteId: disbursement.data.included[0].id,
              unitCount: null,
            });
            return this.Created(ctx, {
              message:
                "We are looking into your request and will proceed surely in some amount of time.",
              data: disbursement.data,
            });
          }
        }
      }
    );
  }

  /**
   * @description This method is used for seeing pending activity for teen and parent both
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/pending-activity", method: HttpMethod.GET })
  @Auth()
  public async seePendingActivity(ctx: any) {
    const user = ctx.request.user;
    const userExists = await UserTable.findOne({ _id: user._id });
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
   * @description This method is used for cancelling pending activity for teen and parent both
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/cancel-pending-activity", method: HttpMethod.POST })
  @Auth()
  public async cancelPendingActivity(ctx: any) {
    const user = ctx.request.user;
    const reqParam = ctx.request.body;
    const userExists = await UserTable.findOne({ _id: user._id });
    if (!userExists) {
      return this.BadRequest(ctx, "User not Found");
    }
    return validation.cancelPendingValidation(
      reqParam,
      ctx,
      async (validate) => {
        if (validate) {
          const userActivity = await UserActivityTable.findOne({
            userId: userExists._id,
            _id: reqParam.id,
            status: EStatus.PENDING,
          });
          if (!userActivity) {
            return this.BadRequest(ctx, "Activity not found");
          }
          await UserActivityTable.updateOne(
            { _id: reqParam.id },
            { $set: { status: EStatus.CANCELLED_SELF } }
          );
          return this.Ok(ctx, { message: "Activity Cancelled Successfully" });
        }
      }
    );
  }

  /**
   * @description This method is used for checking balance for teen as well as parent
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/check-balance", method: HttpMethod.GET })
  @Auth()
  @PrimeTrustJWT()
  public async checkBalance(ctx: any) {
    const user = ctx.request.user;
    const childId = ctx.request.query.childId;
    if (!childId) {
      return this.BadRequest(ctx, "Child Details Doesn't Exists");
    }
    const jwtToken = ctx.request.primeTrustToken;
    const userExists = await UserTable.findOne({ _id: user._id });
    if (!userExists) {
      return this.BadRequest(ctx, "User Not Found");
    }
    const query = { "teens.childId": childId };
    let parent: any = await ParentChildTable.findOne(query);
    if (!parent) return this.BadRequest(ctx, "Invalid User");
    // const accountIdDetails = await parent.teens.find((x: any) =>
    //   userExists.type == EUserType.PARENT
    //     ? parent.firstChildId.toString()
    //     : x.childId.toString() == ctx.request.user._id.toString()
    // );
    const accountIdDetails = await parent.teens.find(
      (x: any) => x.childId.toString() == childId.toString()
    );
    if (!accountIdDetails) {
      return this.BadRequest(ctx, "Account Details Not Found");
    }
    const fetchBalance: any = await getBalance(
      jwtToken,
      accountIdDetails.accountId
    );
    if (fetchBalance.status == 400) {
      return this.BadRequest(ctx, fetchBalance.message);
    }
    const balance = fetchBalance.data.data[0].attributes.disbursable;
    const pending = fetchBalance.data.data[0].attributes["pending-transfer"];
    if (fetchBalance.status == 400) {
      return this.BadRequest(ctx, fetchBalance.message);
    }
    return this.Ok(ctx, { balance: balance, pendingBalance: pending });
  }

  /**
   * @description This method is used to buy crypto
   * @param ctx
   * @returns
   */
  @Route({ path: "/buy-crypto", method: HttpMethod.POST })
  @Auth()
  @PrimeTrustJWT()
  public async buyCrypto(ctx: any) {
    const user = ctx.request.user;
    const reqParam = ctx.request.body;
    const jwtToken = ctx.request.primeTrustToken;
    return validation.buyCryptoValidation(reqParam, ctx, async (validate) => {
      const { amount, cryptoId } = reqParam;
      const crypto = await CryptoTable.findById({ _id: cryptoId });
      if (!crypto) return this.NotFound(ctx, "Crypto Not Found");
      let userExists = await UserTable.findOne({ _id: user._id });
      if (!userExists) {
        return this.BadRequest(ctx, "User Not Found");
      }
      const query =
        userExists.type == EUserType.PARENT
          ? reqParam.childId
            ? { "teens.childId": reqParam.childId }
            : { userId: ctx.request.user._id }
          : { "teens.childId": ctx.request.user._id };
      let parent: any = await ParentChildTable.findOne(query);
      if (!parent) return this.BadRequest(ctx, "Invalid User");
      const accountIdDetails = await parent.teens.find((x: any) =>
        userExists.type == EUserType.PARENT
          ? reqParam.childId
            ? x.childId.toString() == reqParam.childId.toString()
            : x.childId.toString() == parent.firstChildId.toString()
          : x.childId.toString() == ctx.request.user._id.toString()
      );
      if (!accountIdDetails) {
        return this.BadRequest(ctx, "Account Details Not Found");
      }
      const fetchBalance: any = await getBalance(
        jwtToken,
        accountIdDetails.accountId
      );
      if (fetchBalance.status == 400) {
        return this.BadRequest(ctx, fetchBalance.message);
      }
      const balance = fetchBalance.data.data[0].attributes.disbursable;
      if (amount > balance) return this.BadRequest(ctx, "Insufficient funds");

      const userType = (
        await UserTable.findOne(
          { username: user.username },
          { type: 1, _id: -1 }
        )
      ).type;
      const pendingTransactions = await UserActivityTable.aggregate([
        {
          $match: {
            userId: new ObjectId(user._id),
            action: { $in: [EAction.WITHDRAW, EAction.BUY_CRYPTO] },
            status: EStatus.PENDING,
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$currencyValue" },
          },
        },
      ]).exec();

      if (
        pendingTransactions.length > 0 &&
        balance < pendingTransactions[0].total + amount
      ) {
        return this.BadRequest(
          ctx,
          "Please cancel your existing request in order to buy crypto from this request"
        );
      }
      if (
        userExists.type == EUserType.PARENT ||
        (userExists.type == EUserType.TEEN &&
          userExists.isAutoApproval == EAUTOAPPROVAL.ON)
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
          return this.BadRequest(ctx, generateQuoteResponse.message);
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
          return this.BadRequest(ctx, executeQuoteResponse.message);
        }
        await TransactionTable.create({
          assetId: crypto.assetId,
          cryptoId: crypto._id,
          accountId: accountIdDetails.accountId,
          type: ETransactionType.BUY,
          settledTime: moment().unix(),
          amount: amount,
          amountMod: -amount,
          userId: accountIdDetails.childId,
          parentId: parent.userId,
          status: ETransactionStatus.PENDING,
          executedQuoteId: executeQuoteResponse.data.data.id,
          unitCount: executeQuoteResponse.data.data.attributes["unit-count"],
        });
      }

      const activity = await UserActivityTable.create({
        userId: reqParam.childId ? reqParam.childId : user._id,
        message:
          userExists.type == EUserType.PARENT ||
          (userExists.type == EUserType.TEEN &&
            userExists.isAutoApproval == EAUTOAPPROVAL.ON)
            ? `${messages.APPROVE_BUY} ${crypto.name} buy request of $${amount}`
            : `${messages.BUY} ${crypto.name} buy request of $${amount}`,
        action: EAction.BUY_CRYPTO,
        currencyValue: amount,
        currencyType: cryptoId,
        cryptoId: cryptoId,
        userType,
        status:
          userExists.type == EUserType.PARENT ||
          (userExists.type == EUserType.TEEN &&
            userExists.isAutoApproval == EAUTOAPPROVAL.ON)
            ? EStatus.PROCESSED
            : EStatus.PENDING,
      });
      if (
        userType == EUserType.TEEN &&
        userExists.isAutoApproval == EAUTOAPPROVAL.OFF
      ) {
        let deviceTokenData = await DeviceToken.findOne({
          userId: parent.userId,
        });
        if (deviceTokenData) {
          let notificationRequest = {
            key: NOTIFICATION_KEYS.TRADING,
            title: NOTIFICATION.TEEN_REQUEST_MADE,
            message: NOTIFICATION.TEEN_REQUEST_BUY_CRYPTO.replace(
              "@cryto",
              crypto.name
            ),
            activityId: activity._id,
          };
          await sendNotification(
            deviceTokenData.deviceToken,
            notificationRequest.title,
            notificationRequest
          );
          await Notification.create({
            title: notificationRequest.title,
            userId: parent.userId,
            message: notificationRequest.message,
            isRead: ERead.UNREAD,
            data: JSON.stringify(notificationRequest),
          });
        }
      }
      const message =
        userExists.type == EUserType.PARENT ||
        (userExists.type == EUserType.TEEN &&
          userExists.isAutoApproval == EAUTOAPPROVAL.ON)
          ? `Your request for buy order of crypto of $${reqParam.amount} USD has been processed`
          : `Your request for buy order of crypto of $${reqParam.amount} USD has been sent to your parent. Please wait while he/she approves it`;
      return this.Ok(ctx, { message });
    });
  }

  /**
   * @description This method is used to buy crypto
   * @param ctx
   * @returns
   * TODO REMAINING:- CHECK WHTHER THAT STOCK ACTUALLY EXISTS IN OUR PORTFOLIO OR NOT
   */
  @Route({ path: "/sell-crypto", method: HttpMethod.POST })
  @Auth()
  @PrimeTrustJWT()
  public async sellCrypto(ctx: any) {
    const user = ctx.request.user;
    const jwtToken = ctx.request.primeTrustToken;
    const reqParam = ctx.request.body;
    let userExists = await UserTable.findOne({ _id: user._id });
    if (!userExists) {
      return this.BadRequest(ctx, "User Not Found");
    }
    const query =
      userExists.type == EUserType.PARENT
        ? reqParam.childId
          ? { "teens.childId": reqParam.childId }
          : { userId: ctx.request.user._id }
        : { "teens.childId": ctx.request.user._id };
    let parent: any = await ParentChildTable.findOne(query);
    if (!parent) return this.BadRequest(ctx, "Invalid User");
    const accountIdDetails = await parent.teens.find((x: any) =>
      userExists.type == EUserType.PARENT
        ? reqParam.childId
          ? x.childId.toString() == reqParam.childId.toString()
          : x.childId.toString() == parent.firstChildId.toString()
        : x.childId.toString() == ctx.request.user._id.toString()
    );
    if (!accountIdDetails) {
      return this.BadRequest(ctx, "Account Details Not Found");
    }
    return validation.sellCryptoValidation(reqParam, ctx, async (validate) => {
      if (validate) {
        const { amount, cryptoId } = reqParam;
        const crypto = await CryptoTable.findById({ _id: cryptoId });
        if (!crypto) return this.NotFound(ctx, "Crypto Not Found");
        let transactionExists = await TransactionTable.findOne({
          type: ETransactionType.BUY,
          cryptoId: crypto._id,
          userId:
            userExists.type == EUserType.PARENT
              ? reqParam.childId
                ? reqParam.childId
                : parent.firstChildId
              : user._id,
        });
        if (!transactionExists) {
          return this.BadRequest(
            ctx,
            `${crypto.name} doesn't exists in your portfolio.`
          );
        }
        if (
          userExists.type == EUserType.PARENT ||
          (userExists.type == EUserType.TEEN &&
            userExists.isAutoApproval == EAUTOAPPROVAL.ON)
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
            return this.BadRequest(ctx, generateSellQuoteResponse.message);
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
            return this.BadRequest(ctx, executeSellQuoteResponse.message);
          }
          await TransactionTable.create({
            assetId: crypto.assetId,
            cryptoId: crypto._id,
            accountId: accountIdDetails.accountId,
            type: ETransactionType.SELL,
            settledTime: moment().unix(),
            amount: amount,
            amountMod: amount,
            userId: accountIdDetails.childId,
            parentId: parent.userId,
            status: ETransactionStatus.PENDING,
            executedQuoteId: executeSellQuoteResponse.data.data.id,
            unitCount:
              -executeSellQuoteResponse.data.data.attributes["unit-count"],
          });
        }
        const activity = await UserActivityTable.create({
          userId: reqParam.childId ? reqParam.childId : user._id,
          message:
            userExists.type == EUserType.PARENT ||
            (userExists.type == EUserType.TEEN &&
              userExists.isAutoApproval == EAUTOAPPROVAL.ON)
              ? `${messages.APPROVE_SELL} ${crypto.name} sell request of $${amount}`
              : `${messages.SELL} ${crypto.name} sell request of $${amount}`,
          action: EAction.SELL_CRYPTO,
          currencyValue: amount,
          currencyType: cryptoId,
          cryptoId: cryptoId,
          userType: userExists.type,
          status:
            userExists.type == EUserType.PARENT ||
            (userExists.type == EUserType.TEEN &&
              userExists.isAutoApproval == EAUTOAPPROVAL.ON)
              ? EStatus.PROCESSED
              : EStatus.PENDING,
        });
        if (
          userExists.type == EUserType.TEEN &&
          userExists.isAutoApproval == EAUTOAPPROVAL.OFF
        ) {
          let deviceTokenData = await DeviceToken.findOne({
            userId: parent.userId,
          });
          if (deviceTokenData) {
            let notificationRequest = {
              key: NOTIFICATION_KEYS.TRADING,
              title: NOTIFICATION.TEEN_REQUEST_MADE,
              message: NOTIFICATION.TEEN_REQUEST_SELL_CRYPTO.replace(
                "@cryto",
                crypto.name
              ),
              activityId: activity._id,
            };
            await sendNotification(
              deviceTokenData.deviceToken,
              notificationRequest.title,
              notificationRequest
            );
            await Notification.create({
              title: notificationRequest.title,
              userId: parent.userId,
              message: notificationRequest.message,
              isRead: ERead.UNREAD,
              data: JSON.stringify(notificationRequest),
            });
          }
        }
        const message =
          userExists.type == EUserType.PARENT ||
          (userExists.type == EUserType.TEEN &&
            userExists.isAutoApproval == EAUTOAPPROVAL.ON)
            ? `Your request for sell order of crypto of $${reqParam.amount} USD has been processed`
            : `Your request for sell order of crypto of $${reqParam.amount} USD has been sent to your parent. Please wait while he/she approves it.`;
        return this.Ok(ctx, { message });
      }
    });
  }

  /**
   * @description This method is used to get child activities processed and pending
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/get-childs-activities/:childId", method: HttpMethod.GET })
  @Auth()
  public async getChildsActivities(ctx: any) {
    const { childId } = ctx.request.params;
    if (!/^[0-9a-fA-F]{24}$/.test(childId))
      return this.BadRequest(ctx, "Enter Correct Child's ID");
    const parent: any = await ParentChildTable.findOne({
      userId: ctx.request.user._id,
    });
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
   * @description This method is used to reject child's activity
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/reject-childs-activity", method: HttpMethod.POST })
  @Auth()
  public async rejectChildsActivity(ctx: any) {
    const { activityId } = ctx.request.body;
    if (!activityId) {
      return this.BadRequest(ctx, "Activity Id not found");
    }
    const userExists = await UserTable.findOne({ _id: ctx.request.user._id });
    if (!userExists) {
      return this.BadRequest(ctx, "User Not Found");
    }
    if (!/^[0-9a-fA-F]{24}$/.test(activityId))
      return this.BadRequest(ctx, "Enter Correct Activity Details");
    const parent = await ParentChildTable.findOne({
      userId: ctx.request.user._id,
    });
    if (!parent) return this.BadRequest(ctx, "Invalid Parent's ID");

    const activity = await UserActivityTable.findOne(
      { _id: activityId, status: EStatus.PENDING },
      { userId: 1, cryptoId: 1, action: 1, currencyValue: 1 }
    );
    if (!activity) return this.BadRequest(ctx, "Invalid Pending Activity ID");
    let crypto = null;
    if (activity.cryptoId) {
      crypto = await CryptoTable.findOne({ _id: activity.cryptoId });
    }
    await UserActivityTable.updateOne(
      { _id: activityId },
      {
        status: EStatus.REJECTED,
        message:
          activity.action == EAction.DEPOSIT
            ? `${messages.REJECT_DEPOSIT} $${activity.currencyValue}`
            : activity.action == EAction.WITHDRAW
            ? `${messages.REJECT_WITHDRAW} $${activity.currencyValue}`
            : activity.action == EAction.BUY_CRYPTO
            ? `${messages.REJECT_BUY} ${crypto.name} buy request of $${activity.currencyValue}`
            : `${messages.REJECT_SELL} ${crypto.name} sell request of $${activity.currencyValue}`,
      }
    );
    /**
     * Notification
     */
    let deviceTokenData = await DeviceToken.findOne({
      userId: activity.userId,
    });
    if (deviceTokenData) {
      let notificationRequest = {
        key: NOTIFICATION_KEYS.TRADING,
        title: NOTIFICATION.TEEN_REQUEST_DENIED,
        message: NOTIFICATION.TEEN_REQUEST_DENIED_DESCRIPTION,
        activityId: activity._id,
      };
      await sendNotification(
        deviceTokenData.deviceToken,
        notificationRequest.title,
        notificationRequest
      );
      await Notification.create({
        title: notificationRequest.title,
        userId: activity.userId,
        message: notificationRequest.message,
        isRead: ERead.UNREAD,
        data: JSON.stringify(notificationRequest),
      });
    }

    return this.Ok(ctx, { message: "Activity cancelled out successfully" });
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
    const user = ctx.request.user;
    const jwtToken = ctx.request.primeTrustToken;
    const reqParam = ctx.request.params;
    return validation.getPortFolioValidation(
      reqParam,
      ctx,
      async (validate) => {
        if (validate) {
          const childExists = await UserTable.findOne({
            _id: reqParam.childId,
          });
          if (!childExists) {
            return this.BadRequest(ctx, "User Not Found");
          }
          let userExistsForQuiz = null;
          if (childExists.type == EUserType.PARENT) {
            userExistsForQuiz = await ParentChildTable.findOne({
              userId: childExists._id,
            }).populate("firstChildId", ["_id", "preLoadedCoins"]);
          } else {
            userExistsForQuiz = await ParentChildTable.findOne({
              firstChildId: childExists._id,
            }).populate("userId", ["_id", "preLoadedCoins"]);
          }
          const portFolio = await TransactionTable.aggregate([
            {
              $match: {
                userId: new ObjectId(childExists._id),
                type: { $in: [ETransactionType.BUY, ETransactionType.SELL] },
                // status:ETransactionStatus.SETTLED
              },
            },
            {
              $group: {
                _id: "$cryptoId",
                status: {
                  $first: "$status",
                },
                cryptoId: {
                  $first: "$cryptoId",
                },
                type: {
                  $first: "$type",
                },
                totalSum: {
                  $sum: "$unitCount",
                },
                totalAmount: {
                  $sum: "$amount",
                },
                totalAmountMod: {
                  $sum: "$amountMod",
                },
              },
            },
            {
              $redact: {
                $cond: {
                  if: {
                    $gt: ["$totalSum", 0],
                  },
                  then: "$$KEEP",
                  else: {
                    $cond: {
                      if: {
                        $eq: ["$status", 3],
                      },
                      then: "$$KEEP",
                      else: "$$PRUNE",
                    },
                  },
                },
              },
            },
            {
              $lookup: {
                from: "cryptos",
                localField: "cryptoId",
                foreignField: "_id",
                as: "cryptoData",
              },
            },
            {
              $unwind: {
                path: "$cryptoData",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: "cryptoprices",
                localField: "cryptoId",
                foreignField: "cryptoId",
                as: "currentPriceDetails",
              },
            },
            {
              $unwind: {
                path: "$currentPriceDetails",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $addFields: {
                value: {
                  $multiply: ["$currentPriceDetails.currentPrice", "$totalSum"],
                },
              },
            },
            {
              $addFields: {
                totalGainLoss: {
                  $add: ["$value", "$totalAmountMod"],
                },
              },
            },
            {
              $project: {
                _id: 1,
                cryptoId: 1,
                status: 1,
                totalSum: 1,
                type: 1,
                totalAmount: 1,
                totalAmountMod: 1,
                cryptoData: 1,
                currentPrice: "$currentPriceDetails.currentPrice",
                value: {
                  $cond: {
                    if: {
                      $eq: ["$value", 0],
                    },
                    then: "$totalAmount",
                    else: "$value",
                  },
                },
                totalGainLoss: { $round: ["$totalGainLoss", 2] },
              },
            },
          ]).exec();
          let totalStackValue: any = 0;
          let totalGainLoss: any = 0;
          let intialBalance = 0;
          let totalIntAmount = 0;
          if (portFolio.length > 0) {
            await portFolio.map((data) => {
              totalStackValue = parseFloat(
                parseFloat(totalStackValue + data.value).toFixed(2)
              );
              totalGainLoss = parseFloat(
                parseFloat(totalGainLoss + data.totalGainLoss).toFixed(2)
              );
              totalIntAmount = parseFloat(
                parseFloat(data.totalAmount).toFixed(2)
              );
            });
          }
          /**
           * Get Quiz Stack Coins
           */
          const checkQuizExists = await QuizResult.aggregate([
            {
              $match: {
                $or: [
                  { userId: new mongoose.Types.ObjectId(childExists._id) },
                  {
                    userId: userExistsForQuiz
                      ? childExists.type == EUserType.PARENT
                        ? new mongoose.Types.ObjectId(
                            userExistsForQuiz.firstChildId._id
                          )
                        : new mongoose.Types.ObjectId(
                            userExistsForQuiz.userId._id
                          )
                      : null,
                  },
                ],
              },
            },
            {
              $group: {
                _id: 0,
                sum: {
                  $sum: "$pointsEarned",
                },
              },
            },
            {
              $project: {
                _id: 0,
                sum: 1,
              },
            },
          ]).exec();
          let stackCoins = 0;
          if (checkQuizExists.length > 0) {
            stackCoins = checkQuizExists[0].sum;
          }
          stackCoins = stackCoins + childExists.preLoadedCoins;
          let parent: any = await ParentChildTable.findOne({
            "teens.childId": childExists._id,
          }).populate("userId", ["status"]);
          if (
            !parent ||
            parent.userId.status != EUSERSTATUS.KYC_DOCUMENT_VERIFIED
          ) {
            intialBalance = totalIntAmount;
            if (childExists.isGiftedCrypto == 1) {
              return this.Ok(ctx, {
                data: {
                  portFolio,
                  totalStackValue,
                  stackCoins,
                  totalGainLoss,
                  balance: 0,
                  pendingBalance: intialBalance,
                  parentStatus: null,
                  intialBalance: 0,
                },
              });
            } else {
              return this.BadRequest(ctx, "Invalid User");
            }
          }
          const accountIdDetails = await parent.teens.find(
            (x: any) => x.childId.toString() == childExists._id.toString()
          );
          if (!accountIdDetails) {
            return this.BadRequest(ctx, "Account Details Not Found");
          }
          /**
           * Fetch Balance
           */
          const fetchBalance: any = await getBalance(
            jwtToken,
            accountIdDetails.accountId
          );
          if (fetchBalance.status == 400) {
            return this.BadRequest(ctx, fetchBalance.message);
          }
          const balance = fetchBalance.data.data[0].attributes.disbursable;
          const pending =
            fetchBalance.data.data[0].attributes["pending-transfer"];
          totalStackValue = totalStackValue + balance;

          let transactionData = await TransactionTable.aggregate([
            {
              $match: {
                userId: childExists._id,
                type: ETransactionType.DEPOSIT,
                intialDeposit: true,
                status: ETransactionStatus.PENDING,
              },
            },
            {
              $group: {
                _id: 0,
                sum: {
                  $sum: "$amount",
                },
              },
            },
            {
              $project: {
                _id: 0,
                sum: 1,
              },
            },
          ]).exec();
          if (transactionData.length > 0) {
            intialBalance = transactionData[0].sum;
            totalStackValue = totalStackValue + transactionData[0].sum;
          }
          return this.Ok(ctx, {
            data: {
              portFolio,
              totalStackValue,
              stackCoins,
              totalGainLoss,
              balance: balance > 0 ? balance : intialBalance,
              parentStatus: parent.userId.status,
              pendingBalance: pending,
              intialBalance: intialBalance,
            },
          });
        }
      }
    );
  }

  /**
   * @description This method is used to get account details from plaid
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/get-accounts", method: HttpMethod.GET })
  @Auth()
  public async getAccountsFromPlaid(ctx: any) {
    const user = ctx.request.user;
    const parentExists = await ParentChildTable.findOne({ userId: user._id });
    if (!parentExists) {
      return this.BadRequest(ctx, "User Details Not Found");
    }
    const getAccountDetails: any = await getAccounts(parentExists.accessToken);
    if (getAccountDetails.status == 400) {
      return this.BadRequest(ctx, getAccountDetails.message);
    }
    if (parentExists.institutionId) {
      const logo: any = await institutionsGetByIdRequest(
        parentExists.institutionId
      );
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

  /**
   * @description This method is used to approve child activities
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/approve-childs-activity", method: HttpMethod.POST })
  @Auth()
  @PrimeTrustJWT()
  public async approveChildActivity(ctx: any) {
    const { activityId } = ctx.request.body;
    const jwtToken = ctx.request.primeTrustToken;
    if (!activityId) {
      return this.BadRequest(ctx, "Activity Id not found");
    }
    if (!/^[0-9a-fA-F]{24}$/.test(activityId))
      return this.BadRequest(ctx, "Enter Correct Activity Details");

    const userExists = await UserTable.findOne({ _id: ctx.request.user._id });
    if (!userExists) {
      return this.BadRequest(ctx, "User Not Found");
    }
    let parent: any = await ParentChildTable.findOne({
      userId: ctx.request.user._id,
    });
    if (!parent) return this.BadRequest(ctx, "Invalid Parent's ID");

    const activity: any = await UserActivityTable.findOne({
      _id: activityId,
      status: EStatus.PENDING,
    });
    if (!activity) return this.BadRequest(ctx, "Invalid Pending Activity ID");
    const accountIdDetails = await parent.teens.find(
      (x: any) => x.childId.toString() == activity.userId.toString()
    );
    if (!accountIdDetails) {
      return this.BadRequest(ctx, "Account Details Not Found");
    }
    let deviceTokenData = await DeviceToken.findOne({
      userId: accountIdDetails.childId,
    }).select("deviceToken");
    const fetchBalance: any = await getBalance(
      jwtToken,
      accountIdDetails.accountId
    );
    if (fetchBalance.status == 400) {
      return this.BadRequest(ctx, fetchBalance.message);
    }
    const balance = fetchBalance.data.data[0].attributes.disbursable;
    if (
      activity.action != EAction.DEPOSIT &&
      activity.action != EAction.SELL_CRYPTO &&
      balance < activity.currencyValue
    ) {
      return this.BadRequest(
        ctx,
        "You dont have sufficient balance to perform the operarion"
      );
    }
    switch (activity.action) {
      case 1:
        /**
         * Deposit
         */
        if (!parent.processorToken) {
          return this.BadRequest(ctx, "Processor Token Doesn't Exists");
        }
        /**
         * create fund transfer with fund transfer id in response
         */
        let contributionRequest = {
          type: "contributions",
          attributes: {
            "account-id": accountIdDetails.accountId,
            "contact-id": parent.contactId,
            "funds-transfer-method": {
              "funds-transfer-type": "ach",
              "ach-check-type": "personal",
              "contact-id": parent.contactId,
              "plaid-processor-token": parent.processorToken,
            },
            amount: activity.currencyValue,
          },
        };
        const contributions: any = await createContributions(
          jwtToken,
          contributionRequest
        );
        if (contributions.status == 400) {
          return this.BadRequest(ctx, contributions.message);
        }
        await UserActivityTable.updateOne(
          { _id: activityId },
          {
            status: EStatus.PROCESSED,
            message: `${messages.APPROVE_DEPOSIT} $${activity.currencyValue}`,
          }
        );
        await TransactionTable.create({
          assetId: null,
          cryptoId: null,
          accountId: accountIdDetails.accountId,
          type: ETransactionType.DEPOSIT,
          settledTime: moment().unix(),
          amount: activity.currencyValue,
          amountMod: null,
          userId: accountIdDetails.childId,
          parentId: userExists._id,
          status: ETransactionStatus.PENDING,
          executedQuoteId: contributions.data.included[0].id,
          unitCount: null,
        });
        if (deviceTokenData) {
          let notificationRequest = {
            key: NOTIFICATION_KEYS.TRADING,
            title: NOTIFICATION.TEEN_REQUEST_APPROVED,
            message: NOTIFICATION.TEEN_REQUEST_ADD_DEPOSIT_APPROVED,
            activityId: activityId,
          };
          await sendNotification(
            deviceTokenData.deviceToken,
            notificationRequest.title,
            notificationRequest
          );
          await Notification.create({
            title: notificationRequest.title,
            userId: accountIdDetails.childId,
            message: notificationRequest.message,
            isRead: ERead.UNREAD,
            data: JSON.stringify(notificationRequest),
          });
        }
        return this.Ok(ctx, {
          message:
            "You have approved teen's request of deposit. Please wait while it take place accordingly.",
          data: contributions.data,
        });
        break;
      case 2:
        /**
         * Withdraw
         */
        if (!parent.processorToken) {
          return this.BadRequest(ctx, {
            message: "Processor Token Doesn't Exists",
          });
        }
        let disbursementRequest = {
          type: "disbursements",
          attributes: {
            "account-id": accountIdDetails.accountId,
            "contact-id": parent.contactId,
            "funds-transfer-method": {
              "funds-transfer-type": "ach",
              "ach-check-type": "personal",
              "contact-id": parent.contactId,
              "plaid-processor-token": parent.processorToken,
            },
            amount: activity.currencyValue,
          },
        };
        const disbursementResponse: any = await createDisbursements(
          jwtToken,
          disbursementRequest
        );
        if (disbursementResponse.status == 400) {
          return this.BadRequest(ctx, disbursementResponse.message);
        }
        await UserActivityTable.updateOne(
          { _id: activityId },
          {
            status: EStatus.PROCESSED,
            message: `${messages.APPROVE_WITHDRAW} $${activity.currencyValue}`,
          }
        );
        await TransactionTable.create({
          assetId: null,
          cryptoId: null,
          accountId: accountIdDetails.accountId,
          type: ETransactionType.WITHDRAW,
          settledTime: moment().unix(),
          amount: activity.currencyValue,
          amountMod: null,
          userId: accountIdDetails.childId,
          parentId: userExists._id,
          status: ETransactionStatus.PENDING,
          executedQuoteId: disbursementResponse.data.included[0].id,
          unitCount: null,
        });
        if (deviceTokenData) {
          let notificationRequest = {
            key: NOTIFICATION_KEYS.TRADING,
            title: NOTIFICATION.TEEN_REQUEST_APPROVED,
            message: NOTIFICATION.TEEN_REQUEST_ADD_WITHDRAW_APPROVED,
            activityId: activityId,
          };
          await sendNotification(
            deviceTokenData.deviceToken,
            notificationRequest.title,
            notificationRequest
          );
          await Notification.create({
            title: notificationRequest.title,
            userId: accountIdDetails.childId,
            message: notificationRequest.message,
            isRead: ERead.UNREAD,
            data: JSON.stringify(notificationRequest),
          });
        }
        return this.Ok(ctx, {
          data: disbursementResponse.data,
          message:
            "You have approved teen's request of withdrawal. Please wait while it take place accordingly.",
        });
        break;
      case 3:
        /**
         * Buy Crypto
         */
        if (!activity.cryptoId) {
          return this.BadRequest(ctx, "Asset Id Not Found");
        }
        const cryptoData = await CryptoTable.findOne({
          _id: activity.cryptoId,
        });
        /**
         * Generate a quote
         */
        const requestQuoteDay: any = {
          data: {
            type: "quotes",
            attributes: {
              "account-id": accountIdDetails.accountId,
              "asset-id": cryptoData.assetId,
              hot: true,
              "transaction-type": "buy",
              total_amount: activity.currencyValue,
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
              "account-id": accountIdDetails.accountId,
              "asset-id": cryptoData.assetId,
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
        await TransactionTable.create({
          assetId: cryptoData.assetId,
          cryptoId: cryptoData._id,
          accountId: accountIdDetails.accountId,
          type: ETransactionType.BUY,
          settledTime: moment().unix(),
          amount: activity.currencyValue,
          amountMod: -activity.currencyValue,
          userId: accountIdDetails.childId,
          parentId: userExists._id,
          status: ETransactionStatus.PENDING,
          executedQuoteId: executeQuoteResponse.data.data.id,
          unitCount: executeQuoteResponse.data.data.attributes["unit-count"],
        });
        await UserActivityTable.updateOne(
          { _id: activityId },
          {
            status: EStatus.PROCESSED,
            message: `${messages.APPROVE_BUY} ${cryptoData.name} buy request of $${activity.currencyValue}`,
          }
        );
        if (deviceTokenData) {
          let notificationRequest = {
            key: NOTIFICATION_KEYS.TRADING,
            title: NOTIFICATION.TEEN_REQUEST_APPROVED,
            message: NOTIFICATION.TEEN_REQUEST_BUY_CRYPTO_APPROVED.replace(
              "@crypto",
              cryptoData.name
            ),
            activityId: activityId,
          };
          await sendNotification(
            deviceTokenData.deviceToken,
            notificationRequest.title,
            notificationRequest
          );
          await Notification.create({
            title: notificationRequest.title,
            userId: accountIdDetails.childId,
            message: notificationRequest.message,
            isRead: ERead.UNREAD,
            data: JSON.stringify(notificationRequest),
          });
        }
        return this.Ok(ctx, {
          message: "Success",
          data: "You have approved teen's request of buying crypto. Please wait while it settles in the portfolio respectively.",
          dataValue: { generateQuoteResponse, executeQuoteResponse },
        });
        break;
      case 4:
        /**
         * Sell Crypto
         */
        if (!activity.cryptoId) {
          return this.BadRequest(ctx, "Asset Id Not Found");
        }
        const sellCryptoData = await CryptoTable.findOne({
          _id: activity.cryptoId,
        });
        let transactionExists = await TransactionTable.findOne({
          type: ETransactionType.BUY,
          cryptoId: sellCryptoData._id,
          userId: accountIdDetails.childId,
        });
        if (!transactionExists) {
          return this.BadRequest(
            ctx,
            `${sellCryptoData.name} doesn't exists in your portfolio.`
          );
        }
        /**
         * Generate a quote
         */
        const requestSellQuoteDay: any = {
          data: {
            type: "quotes",
            attributes: {
              "account-id": accountIdDetails.accountId,
              "asset-id": sellCryptoData.assetId,
              hot: true,
              "transaction-type": "sell",
              total_amount: activity.currencyValue,
            },
          },
        };
        const generateSellQuoteResponse: any = await generateQuote(
          jwtToken,
          requestSellQuoteDay
        );
        if (generateSellQuoteResponse.status == 400) {
          return this.BadRequest(ctx, generateSellQuoteResponse.message);
        }
        /**
         * Execute a quote
         */
        const requestSellExecuteQuote: any = {
          data: {
            type: "quotes",
            attributes: {
              "account-id": accountIdDetails.accountId,
              "asset-id": sellCryptoData.assetId,
            },
          },
        };
        const executeSellQuoteResponse: any = await executeQuote(
          jwtToken,
          generateSellQuoteResponse.data.data.id,
          requestSellExecuteQuote
        );
        if (executeSellQuoteResponse.status == 400) {
          return this.BadRequest(ctx, executeSellQuoteResponse.message);
        }
        await TransactionTable.create({
          assetId: sellCryptoData.assetId,
          cryptoId: sellCryptoData._id,
          accountId: accountIdDetails.accountId,
          type: ETransactionType.SELL,
          settledTime: moment().unix(),
          amount: activity.currencyValue,
          amountMod: activity.currencyValue,
          userId: accountIdDetails.childId,
          parentId: userExists._id,
          status: ETransactionStatus.PENDING,
          executedQuoteId: executeSellQuoteResponse.data.data.id,
          unitCount:
            -executeSellQuoteResponse.data.data.attributes["unit-count"],
        });
        await UserActivityTable.updateOne(
          { _id: activityId },
          {
            status: EStatus.PROCESSED,
            message: `${messages.APPROVE_SELL} ${sellCryptoData.name} sell request of $${activity.currencyValue}`,
          }
        );
        if (deviceTokenData) {
          let notificationRequest = {
            key: NOTIFICATION_KEYS.TRADING,
            title: NOTIFICATION.TEEN_REQUEST_APPROVED,
            message: NOTIFICATION.TEEN_REQUEST_SELL_CRYPTO_APPROVED.replace(
              "@crypto",
              sellCryptoData.name
            ),
            activityId: activityId,
          };
          await sendNotification(
            deviceTokenData.deviceToken,
            notificationRequest.title,
            notificationRequest
          );
          await Notification.create({
            title: notificationRequest.title,
            userId: accountIdDetails.childId,
            message: notificationRequest.message,
            isRead: ERead.UNREAD,
            data: JSON.stringify(notificationRequest),
          });
        }
        return this.Ok(ctx, {
          message: "Success",
          data: "You have approved teen's request of selling crypto. Please wait while it settles in the portfolio respectively.",
        });
        break;

      default:
        return this.BadRequest(ctx, "Something went wrong");
    }
  }

  /**
   * @description This method is
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/get-wire-transfer", method: HttpMethod.GET })
  @Auth()
  @PrimeTrustJWT()
  public async getWireTransfer(ctx: any) {
    let accountId: any = await getAccountId(ctx.request.user._id);
    if (!accountId) return this.BadRequest(ctx, "AccountId not found.");
    let response = await getWireTransfer(
      ctx.request.primeTrustToken,
      accountId
    );
    return this.Ok(ctx, { data: response });
  }

  /**
   * @description This method is used for wire transfer for push instructions
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/wire-transfer", method: HttpMethod.GET })
  @Auth()
  @PrimeTrustJWT()
  public async wireTransfer(ctx: any) {
    const parentChildExists = await ParentChildTable.findOne({
      userId: ctx.request.user._id,
    });
    if (!parentChildExists) {
      return this.BadRequest(ctx, "User Not Found");
    }
    if (parentChildExists.pushTransferId) {
      const getPushInstruction: any = await getPushTransferMethods(
        ctx.request.primeTrustToken,
        parentChildExists.pushTransferId
      );
      return this.Ok(ctx, {
        data: getPushInstruction.data.data.attributes["push-instructions"],
      });
    }
    let accountId = await getAccountId(ctx.request.user._id);
    if (!accountId) return this.BadRequest(ctx, "AccountId not found");
    let contactId = await getContactId(ctx.request.user._id);
    if (!contactId) return this.BadRequest(ctx, "ContactId not found");
    let response: any = await wireTransfer(ctx.request.primeTrustToken, {
      type: "push-transfer-methods",
      attributes: {
        "account-id": accountId,
        "contact-id": contactId,
      },
    });
    if (response.status == 400) {
      return this.BadRequest(ctx, response.message);
    }
    await ParentChildTable.updateOne(
      { userId: ctx.request.user._id },
      {
        $set: { pushTransferId: response.data.data.id },
      }
    );
    return this.Ok(ctx, {
      data: response.data.data.attributes["push-instructions"],
    });
  }

  /**
   * @description This method is used for updating auto approval for their teens
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/update-auto-approval/:childId", method: HttpMethod.POST })
  @Auth()
  @PrimeTrustJWT()
  public async updateAutoApprovalForTeens(ctx: any) {
    let childId = ctx.request.params.childId;
    const jwtToken = ctx.request.primeTrustToken;
    let reqParam = ctx.request.body;
    if (!childId) {
      return this.BadRequest(ctx, "Please enter child details");
    }
    let parent: any = await ParentChildTable.findOne({
      userId: ctx.request.user._id,
      "teens.childId": childId,
    }).populate("teens.childId", ["_id", "isAutoApproval"]);
    if (!parent) {
      return this.BadRequest(ctx, "Child Details Not Found");
    }
    let accountIdDetails = parent.teens.find(
      (x) => x.childId._id.toString() == childId.toString()
    );
    if (!accountIdDetails) {
      return this.BadRequest(ctx, "Child Details Not Found");
    }
    let deviceTokenData = await DeviceToken.findOne({
      userId: accountIdDetails.childId,
    }).select("deviceToken");
    return validation.updateAutoApprovalValidation(
      reqParam,
      ctx,
      async (validate) => {
        if (validate) {
          if (
            accountIdDetails.childId.isAutoApproval == reqParam.isAutoApproval
          ) {
            let message =
              reqParam.isAutoApproval == EAUTOAPPROVAL.OFF ? "off" : "on";
            return this.BadRequest(
              ctx,
              `The auto approval setting is already ${message}`
            );
          }
          await UserTable.updateOne(
            { _id: childId },
            {
              $set: {
                isAutoApproval: reqParam.isAutoApproval,
              },
            }
          );
          const fetchBalance: any = await getBalance(
            jwtToken,
            accountIdDetails.accountId
          );
          if (fetchBalance.status == 400) {
            return this.BadRequest(ctx, fetchBalance.message);
          }
          const balance = fetchBalance.data.data[0].attributes.disbursable;
          /**
           * is auto approval if 1 then make all request as approved
           */
          let pendingActivities = await UserActivityTable.find({
            userId: childId,
            status: EStatus.PENDING,
          });
          let insufficentBalance = false;
          if (pendingActivities.length > 0) {
            for await (let activity of pendingActivities) {
              if (
                activity.action != EAction.DEPOSIT &&
                activity.action != EAction.SELL_CRYPTO &&
                balance < activity.currencyValue
              ) {
                insufficentBalance = true;
                break;
              }
              switch (activity.action) {
                case 1:
                  /**
                   * Deposit
                   */
                  let contributionRequest = {
                    type: "contributions",
                    attributes: {
                      "account-id": accountIdDetails.accountId,
                      "contact-id": parent.contactId,
                      "funds-transfer-method": {
                        "funds-transfer-type": "ach",
                        "ach-check-type": "personal",
                        "contact-id": parent.contactId,
                        "plaid-processor-token": parent.processorToken,
                      },
                      amount: activity.currencyValue,
                    },
                  };
                  const contributions: any = await createContributions(
                    jwtToken,
                    contributionRequest
                  );
                  if (contributions.status == 400) {
                    return this.BadRequest(ctx, contributions.message);
                  }
                  await UserActivityTable.updateOne(
                    { _id: activity._id },
                    {
                      status: EStatus.PROCESSED,
                      message: `${messages.APPROVE_DEPOSIT} $${activity.currencyValue}`,
                    }
                  );
                  await TransactionTable.create({
                    assetId: null,
                    cryptoId: null,
                    accountId: accountIdDetails.accountId,
                    type: ETransactionType.DEPOSIT,
                    settledTime: moment().unix(),
                    amount: activity.currencyValue,
                    amountMod: null,
                    userId: accountIdDetails.childId,
                    parentId: parent.userId,
                    status: ETransactionStatus.PENDING,
                    executedQuoteId: contributions.data.included[0].id,
                    unitCount: null,
                  });
                  if (deviceTokenData) {
                    let notificationRequest = {
                      key: NOTIFICATION_KEYS.TRADING,
                      title: NOTIFICATION.TEEN_REQUEST_APPROVED,
                      message: NOTIFICATION.TEEN_REQUEST_ADD_DEPOSIT_APPROVED,
                      activityId: activity._id,
                    };
                    await sendNotification(
                      deviceTokenData.deviceToken,
                      notificationRequest.title,
                      notificationRequest
                    );
                    await Notification.create({
                      title: notificationRequest.title,
                      userId: accountIdDetails.childId,
                      message: notificationRequest.message,
                      isRead: ERead.UNREAD,
                      data: JSON.stringify(notificationRequest),
                    });
                  }
                  break;
                case 2:
                  let disbursementRequest = {
                    type: "disbursements",
                    attributes: {
                      "account-id": accountIdDetails.accountId,
                      "contact-id": parent.contactId,
                      "funds-transfer-method": {
                        "funds-transfer-type": "ach",
                        "ach-check-type": "personal",
                        "contact-id": parent.contactId,
                        "plaid-processor-token": parent.processorToken,
                      },
                      amount: activity.currencyValue,
                    },
                  };
                  const disbursementResponse: any = await createDisbursements(
                    jwtToken,
                    disbursementRequest
                  );
                  if (disbursementResponse.status == 400) {
                    return this.BadRequest(ctx, disbursementResponse.message);
                  }
                  await UserActivityTable.updateOne(
                    { _id: activity._id },
                    {
                      status: EStatus.PROCESSED,
                      message: `${messages.APPROVE_WITHDRAW} $${activity.currencyValue}`,
                    }
                  );
                  await TransactionTable.create({
                    assetId: null,
                    cryptoId: null,
                    accountId: accountIdDetails.accountId,
                    type: ETransactionType.WITHDRAW,
                    settledTime: moment().unix(),
                    amount: activity.currencyValue,
                    amountMod: null,
                    userId: accountIdDetails.childId,
                    parentId: parent.userId,
                    status: ETransactionStatus.PENDING,
                    executedQuoteId: disbursementResponse.data.included[0].id,
                    unitCount: null,
                  });
                  if (deviceTokenData) {
                    let notificationRequest = {
                      key: NOTIFICATION_KEYS.TRADING,
                      title: NOTIFICATION.TEEN_REQUEST_APPROVED,
                      message: NOTIFICATION.TEEN_REQUEST_ADD_WITHDRAW_APPROVED,
                      activityId: activity._id,
                    };
                    await sendNotification(
                      deviceTokenData.deviceToken,
                      notificationRequest.title,
                      notificationRequest
                    );
                    await Notification.create({
                      title: notificationRequest.title,
                      userId: accountIdDetails.childId,
                      message: notificationRequest.message,
                      isRead: ERead.UNREAD,
                      data: JSON.stringify(notificationRequest),
                    });
                  }
                  break;
                case 3:
                  if (!activity.cryptoId) {
                    return this.BadRequest(ctx, "Asset Id Not Found");
                  }
                  const cryptoData = await CryptoTable.findOne({
                    _id: activity.cryptoId,
                  });
                  /**
                   * Generate a quote
                   */
                  const requestQuoteDay: any = {
                    data: {
                      type: "quotes",
                      attributes: {
                        "account-id": accountIdDetails.accountId,
                        "asset-id": cryptoData.assetId,
                        hot: true,
                        "transaction-type": "buy",
                        total_amount: activity.currencyValue,
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
                        "account-id": accountIdDetails.accountId,
                        "asset-id": cryptoData.assetId,
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
                  await TransactionTable.create({
                    assetId: cryptoData.assetId,
                    cryptoId: cryptoData._id,
                    accountId: accountIdDetails.accountId,
                    type: ETransactionType.BUY,
                    settledTime: moment().unix(),
                    amount: activity.currencyValue,
                    amountMod: -activity.currencyValue,
                    userId: accountIdDetails.childId,
                    parentId: parent.userId,
                    status: ETransactionStatus.PENDING,
                    executedQuoteId: executeQuoteResponse.data.data.id,
                    unitCount:
                      executeQuoteResponse.data.data.attributes["unit-count"],
                  });
                  await UserActivityTable.updateOne(
                    { _id: activity._id },
                    {
                      $set: {
                        status: EStatus.PROCESSED,
                        message: `${messages.APPROVE_BUY} ${cryptoData.name} buy request of $${activity.currencyValue}`,
                      },
                    }
                  );
                  if (deviceTokenData) {
                    let notificationRequest = {
                      key: NOTIFICATION_KEYS.TRADING,
                      title: NOTIFICATION.TEEN_REQUEST_APPROVED,
                      message:
                        NOTIFICATION.TEEN_REQUEST_BUY_CRYPTO_APPROVED.replace(
                          "@crypto",
                          cryptoData.name
                        ),
                      activityId: activity._id,
                    };
                    await sendNotification(
                      deviceTokenData.deviceToken,
                      notificationRequest.title,
                      notificationRequest
                    );
                    await Notification.create({
                      title: notificationRequest.title,
                      userId: accountIdDetails.childId,
                      message: notificationRequest.message,
                      isRead: ERead.UNREAD,
                      data: JSON.stringify(notificationRequest),
                    });
                  }
                  break;
                case 4:
                  if (!activity.cryptoId) {
                    return this.BadRequest(ctx, "Asset Id Not Found");
                  }
                  const sellCryptoData = await CryptoTable.findOne({
                    _id: activity.cryptoId,
                  });
                  /**
                   * Generate a quote
                   */
                  const requestSellQuoteDay: any = {
                    data: {
                      type: "quotes",
                      attributes: {
                        "account-id": accountIdDetails.accountId,
                        "asset-id": sellCryptoData.assetId,
                        hot: true,
                        "transaction-type": "sell",
                        total_amount: activity.currencyValue,
                      },
                    },
                  };
                  const generateSellQuoteResponse: any = await generateQuote(
                    jwtToken,
                    requestSellQuoteDay
                  );
                  if (generateSellQuoteResponse.status == 400) {
                    return this.BadRequest(
                      ctx,
                      generateSellQuoteResponse.message
                    );
                  }
                  /**
                   * Execute a quote
                   */
                  const requestSellExecuteQuote: any = {
                    data: {
                      type: "quotes",
                      attributes: {
                        "account-id": accountIdDetails.accountId,
                        "asset-id": sellCryptoData.assetId,
                      },
                    },
                  };
                  const executeSellQuoteResponse: any = await executeQuote(
                    jwtToken,
                    generateSellQuoteResponse.data.data.id,
                    requestSellExecuteQuote
                  );
                  if (executeSellQuoteResponse.status == 400) {
                    return this.BadRequest(
                      ctx,
                      executeSellQuoteResponse.message
                    );
                  }
                  await TransactionTable.create({
                    assetId: sellCryptoData.assetId,
                    cryptoId: sellCryptoData._id,
                    accountId: accountIdDetails.accountId,
                    type: ETransactionType.SELL,
                    settledTime: moment().unix(),
                    amount: activity.currencyValue,
                    amountMod: activity.currencyValue,
                    userId: accountIdDetails.childId,
                    parentId: parent.userId,
                    status: ETransactionStatus.PENDING,
                    executedQuoteId: executeSellQuoteResponse.data.data.id,
                    unitCount:
                      -executeSellQuoteResponse.data.data.attributes[
                        "unit-count"
                      ],
                  });
                  await UserActivityTable.updateOne(
                    { _id: activity._id },
                    {
                      status: EStatus.PROCESSED,
                      message: `${messages.APPROVE_SELL} ${sellCryptoData.name} sell request of $${activity.currencyValue}`,
                    }
                  );
                  if (deviceTokenData) {
                    let notificationRequest = {
                      key: NOTIFICATION_KEYS.TRADING,
                      title: NOTIFICATION.TEEN_REQUEST_APPROVED,
                      message:
                        NOTIFICATION.TEEN_REQUEST_SELL_CRYPTO_APPROVED.replace(
                          "@crypto",
                          sellCryptoData.name
                        ),
                      activityId: activity._id,
                    };
                    await sendNotification(
                      deviceTokenData.deviceToken,
                      notificationRequest.title,
                      notificationRequest
                    );
                    await Notification.create({
                      title: notificationRequest.title,
                      userId: accountIdDetails.childId,
                      message: notificationRequest.message,
                      isRead: ERead.UNREAD,
                      data: JSON.stringify(notificationRequest),
                    });
                  }
                  break;
                default:
                  return this.BadRequest(ctx, "Something went wrong");
              }
            }
            if (insufficentBalance) {
              return this.BadRequest(
                ctx,
                "You dont have sufficient balance to perform the operarion"
              );
            }
          }
          return this.Ok(ctx, { message: "Success" });
        }
      }
    );
  }
}

export default new TradingController();
