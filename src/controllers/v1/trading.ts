import moment from "moment";
import { ObjectId } from "mongodb";
import envData from "@app/config/index";
import { Auth, PrimeTrustJWT } from "@app/middleware";
import {
  AdminTable,
  CryptoTable,
  ParentChildTable,
  TransactionTable,
  UserActivityTable,
  UserBanksTable,
  UserTable,
} from "@app/model";
import {
  DeviceTokenService,
  PortfolioService,
  TradingDBService,
  tradingService,
  UserBankDBService,
  UserDBService,
  userService,
  zohoCrmService,
} from "@app/services/v1/index";
import {
  EAction,
  EAUTOAPPROVAL,
  EGIFTSTACKCOINSSETTING,
  ERECURRING,
  ESCREENSTATUS,
  EStatus,
  ETransactionStatus,
  ETransactionType,
  EUSERSTATUS,
  EUserType,
  HttpMethod,
  messages,
} from "@app/types";
import {
  createBank,
  createContributions,
  createDisbursements,
  createProcessorToken,
  executeQuote,
  generateQuote,
  getAccountId,
  getAccounts,
  getAssets,
  getAssetTotalWithId,
  getBalance,
  getContactId,
  getPublicTokenExchange,
  getPushTransferMethods,
  getWireTransfer,
  institutionsGetByIdRequest,
  internalAssetTransfers,
  Route,
  wireTransfer,
  NOTIFICATION,
  NOTIFICATION_KEYS,
  PARENT_SIGNUP_FUNNEL,
  PLAID_ITEM_ERROR,
  PT_REFERENCE_TEXT,
} from "@app/utility";
import { validation } from "@app/validations/v1/apiValidation";
import BaseController from "@app/controllers/base";

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
             * added bank successfully
             */
            let ParentArray = [
              ...PARENT_SIGNUP_FUNNEL.SIGNUP,
              PARENT_SIGNUP_FUNNEL.DOB,
              PARENT_SIGNUP_FUNNEL.CONFIRM_DETAILS,
              PARENT_SIGNUP_FUNNEL.CHILD_INFO,
              PARENT_SIGNUP_FUNNEL.UPLOAD_DOCUMENT,
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
            parentId: userExists._id,
            status: ETransactionStatus.PENDING,
            executedQuoteId: contributions.data.included[0].id,
            unitCount: null,
          });

          return this.Created(ctx, {
            message: `Transaction Processed!`,
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
   * @description This method is used to withdraw money for parent as well as for teen
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
          let userBankInfo = await UserBanksTable.findOne({
            _id: reqParam.bankId,
          });
          if (!userBankInfo) {
            return this.BadRequest(ctx, "Bank Details Not Found");
          }
          /**
           * Check current balance is greather than withdrawable amount
           */
          const query =
            userExists.type == EUserType.PARENT ||
            userExists.type == EUserType.SELF
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
                  userExists.type == EUserType.PARENT
                    ? reqParam.childId
                      ? x.childId.toString() == reqParam.childId.toString()
                      : x.childId.toString() ==
                        parentDetails.firstChildId.toString()
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
            return this.BadRequest(ctx, "ERROR: Insufficient Funds");
          }
          const checkUserActivityForWithdraw =
            await UserActivityTable.aggregate([
              {
                $match: {
                  userId: userExists._id,
                  action: { $in: [EAction.WITHDRAW, EAction.BUY_CRYPTO] },
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
          let mainQuery =
            userExists.type == EUserType.PARENT ||
            userExists.type == EUserType.SELF ||
            (userExists.type == EUserType.TEEN &&
              userExists.isAutoApproval == EAUTOAPPROVAL.ON);
          if (mainQuery) {
            disbursement = await tradingService.withdrawAction(
              accountIdDetails,
              parentDetails,
              userBankInfo,
              jwtToken,
              reqParam.amount
            );
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
            }

            /*  message:
                 userExists.isAutoApproval == EAUTOAPPROVAL.ON
                   ? `"We are looking into your request and will proceed surely in some amount of time."`
                  : `Your request for withdrawal of $${reqParam.amount} USD has been sent to your parent. Please wait while he/she approves it`,
 */
            return this.Created(ctx, {
              message: "Transaction Processed!",
            });
          }
          /**
           * For parent create disbursement code of prime trust with plaid processor token
           */
          if (
            userExists.type === EUserType.PARENT ||
            userExists.type === EUserType.SELF
          ) {
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
              userId: accountIdDetails.childId
                ? accountIdDetails.childId
                : userExists._id,
              parentId: userExists._id,
              status: ETransactionStatus.PENDING,
              executedQuoteId: disbursement.data.included[0].id,
              unitCount: null,
            });

            return this.Created(ctx, {
              message: "Transaction Processed!",
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
    return validation.buyCryptoValidation(reqParam, ctx, async () => {
      const { amount, cryptoId } = reqParam;
      const crypto = await CryptoTable.findById({ _id: cryptoId });
      if (!crypto) return this.NotFound(ctx, "Crypto Not Found");
      let userExists = await UserTable.findOne({ _id: user._id });
      if (!userExists) {
        return this.BadRequest(ctx, "User Not Found");
      }
      const query =
        userExists.type == EUserType.PARENT ||
        userExists.type === EUserType.SELF
          ? reqParam.childId
            ? { "teens.childId": reqParam.childId }
            : { userId: ctx.request.user._id }
          : { "teens.childId": ctx.request.user._id };
      let parent: any = await ParentChildTable.findOne(query);
      if (!parent) return this.BadRequest(ctx, "Invalid User");
      const accountIdDetails =
        userExists.type === EUserType.SELF
          ? parent
          : await parent.teens.find((x: any) =>
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
      if (amount > balance)
        return this.BadRequest(ctx, "ERROR: Insufficient Funds");

      const userType = (
        await UserTable.findOne({ _id: user._id }, { type: 1, _id: -1 })
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
      let mainQuery =
        userExists.type == EUserType.PARENT ||
        userExists.type == EUserType.SELF ||
        (userExists.type == EUserType.TEEN &&
          userExists.isAutoApproval == EAUTOAPPROVAL.ON);
      if (mainQuery) {
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
          userId: accountIdDetails.childId
            ? accountIdDetails.childId
            : parent.userId,
          parentId: parent.userId,
          status: ETransactionStatus.PENDING,
          executedQuoteId: executeQuoteResponse.data.data.id,
          unitCount: executeQuoteResponse.data.data.attributes["unit-count"],
        });
      }

      const activity = await UserActivityTable.create({
        userId: reqParam.childId ? reqParam.childId : user._id,
        message: mainQuery
          ? `${messages.APPROVE_BUY} ${crypto.name} buy request of $${amount}`
          : `${messages.BUY} ${crypto.name} buy request of $${amount}`,
        action: EAction.BUY_CRYPTO,
        currencyValue: amount,
        currencyType: cryptoId,
        cryptoId: cryptoId,
        userType,
        status: mainQuery ? EStatus.PROCESSED : EStatus.PENDING,
      });
      /* const message = mainQuery
        ? `Your request for buy order of crypto of $${reqParam.amount} USD has been processed`
         : `Your request for buy order of crypto of $${reqParam.amount} USD has been sent to your parent. Please wait while he/she approves it`; */
      const message = "Transaction Processed!";
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
      userExists.type == EUserType.PARENT || userExists.type === EUserType.SELF
        ? reqParam.childId
          ? { "teens.childId": reqParam.childId }
          : { userId: ctx.request.user._id }
        : { "teens.childId": ctx.request.user._id };
    let parent: any = await ParentChildTable.findOne(query);
    if (!parent) return this.BadRequest(ctx, "Invalid User");
    const accountIdDetails =
      userExists.type === EUserType.SELF
        ? parent
        : await parent.teens.find((x: any) =>
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
        let mainQuery =
          userExists.type == EUserType.PARENT ||
          userExists.type == EUserType.SELF ||
          (userExists.type == EUserType.TEEN &&
            userExists.isAutoApproval == EAUTOAPPROVAL.ON);
        if (mainQuery) {
          const getUnitCount: any = await getAssetTotalWithId(
            jwtToken,
            accountIdDetails.accountId,
            crypto.assetId
          );

          if (getUnitCount.status == 400) {
            throw Error(getUnitCount.message);
          }
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
                ...(!reqParam.isMax && { total_amount: amount }),
                ...(reqParam.isMax && {
                  unit_count: getUnitCount.data.data[0].attributes.settled,
                }),
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
            userId: accountIdDetails.childId
              ? accountIdDetails.childId
              : parent.userId,
            parentId: parent.userId,
            status: ETransactionStatus.PENDING,
            executedQuoteId: executeSellQuoteResponse.data.data.id,
            unitCount:
              -executeSellQuoteResponse.data.data.attributes["unit-count"],
            isMax: reqParam.isMax ? true : false,
          });
        }
        const activity = await UserActivityTable.create({
          userId: reqParam.childId ? reqParam.childId : user._id,
          message: mainQuery
            ? `${messages.APPROVE_SELL} ${crypto.name} sell request of $${amount}`
            : `${messages.SELL} ${crypto.name} sell request of $${amount}`,
          action: EAction.SELL_CRYPTO,
          currencyValue: amount,
          currencyType: cryptoId,
          cryptoId: cryptoId,
          userType: userExists.type,
          status: mainQuery ? EStatus.PROCESSED : EStatus.PENDING,
          isMax: reqParam.isMax ? true : false,
        });
        /* const message = mainQuery
           ? `Your request for sell order of crypto of $${reqParam.amount} USD has been processed`
           : `Your request for sell order of crypto of $${reqParam.amount} USD has been sent to your parent. Please wait while he/she approves it.`; */
        const message = "Transaction Processed!";
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
    const jwtToken = ctx.request.primeTrustToken;
    const reqParam = ctx.request.params;
    console.log("----getPortfolio v1----", reqParam);
    return validation.getPortFolioValidation(
      reqParam,
      ctx,
      async (validate) => {
        console.log("----validate----", validate);
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
            await TradingDBService.getPortfolioTransactions(
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
            await TradingDBService.getPendingInitialDeposit(childExists._id);
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

  /**
   * @description This method is used to get account details from plaid
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/get-accounts", method: HttpMethod.GET })
  @Auth()
  public async getAccountsFromPlaid(ctx: any) {
    const user = ctx.request.user;
    const userBankExists = await UserBanksTable.findOne({ userId: user._id });
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
      return this.BadRequest(ctx, "ERROR: Insufficient Funds");
    }
    const userBankInfo = await UserBanksTable.findOne({
      $and: [
        { isDefault: 1 },
        {
          $or: [
            {
              userId: userExists._id,
            },
            {
              parentId: userExists._id,
            },
          ],
        },
      ],
    });
    switch (activity.action) {
      case 1:
        /**
         * Deposit
         */
        if (!userBankInfo) {
          return this.BadRequest(ctx, "Bank Details Not Found");
        }
        let contributions = await tradingService.depositAction(
          accountIdDetails,
          parent,
          userBankInfo,
          jwtToken,
          activity.currencyValue
        );
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

        return this.Ok(ctx, {
          message: "Transaction Processed!",
          data: contributions.data,
        });
      case 2:
        /**
         * Withdraw
         */
        if (!userBankInfo) {
          return this.BadRequest(ctx, "Bank Details Not Found");
        }
        let disbursementResponse = await tradingService.withdrawAction(
          accountIdDetails,
          parent,
          userBankInfo,
          jwtToken,
          activity.currencyValue
        );
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

        return this.Ok(ctx, {
          data: disbursementResponse.data,
          message: "Transaction Processed!",
        });
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

        return this.Ok(ctx, {
          message: "Success",
          data: "Transaction Processed!",
          dataValue: { generateQuoteResponse, executeQuoteResponse },
        });
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

        const getUnitCount: any = await getAssetTotalWithId(
          jwtToken,
          accountIdDetails.accountId,
          sellCryptoData.assetId
        );

        if (getUnitCount.status == 400) {
          throw Error(getUnitCount.message);
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
              ...(!activity.isMax && { total_amount: activity.currencyValue }),
              ...(activity.isMax && {
                unit_count: getUnitCount.data.data[0].attributes.settled,
              }),
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

        return this.Ok(ctx, {
          message: "Success",
          data: "Transaction Processed!",
        });

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
      (x) => x.childId && x.childId._id.toString() == childId.toString()
    );
    if (!accountIdDetails) {
      return this.BadRequest(ctx, "Child Details Not Found");
    }
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
          let pendingActivities = await UserActivityTable.find({
            userId: childId,
            status: EStatus.PENDING,
          });
          if (
            reqParam.isAutoApproval == EAUTOAPPROVAL.OFF ||
            (pendingActivities.length === 0 &&
              reqParam.isAutoApproval == EAUTOAPPROVAL.ON)
          ) {
            return this.Ok(ctx, { message: "Success" });
          }
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

          let insufficentBalance = false;
          if (pendingActivities.length > 0) {
            const userBankInfo = await UserBanksTable.findOne({
              $and: [
                { isDefault: 1 },
                {
                  userId: ctx.request.user._id,
                },
              ],
            });
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
                  if (!userBankInfo) {
                    return this.BadRequest(ctx, "Bank Details Not Found");
                  }
                  let contributionRequest = {
                    type: "contributions",
                    attributes: {
                      "account-id": accountIdDetails.accountId,
                      "contact-id": parent.contactId,
                      "funds-transfer-method": {
                        "funds-transfer-type": "ach",
                        "ach-check-type": "personal",
                        "contact-id": parent.contactId,
                        "plaid-processor-token": userBankInfo.processorToken,
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
                  break;
                case 2:
                  if (!userBankInfo) {
                    return this.BadRequest(ctx, "Bank Details Not Found");
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
                        "plaid-processor-token": userBankInfo.processorToken,
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
                  break;
                default:
                  return this.BadRequest(ctx, "Something went wrong");
              }
            }
            if (insufficentBalance) {
              return this.BadRequest(
                ctx,
                "You dont have sufficient balance to perform the operation"
              );
            }
          }
          return this.Ok(ctx, { message: "Success" });
        }
      }
    );
  }

  /**
   * @description This method is used for turning off or on recurring deposit
   * @param ctx
   * @return {*}
   */
  @Route({ path: "/schedule-recurring", method: HttpMethod.POST })
  @Auth()
  public async updateRecurringDepositStatus(ctx: any) {
    let reqParam = ctx.request.body;
    let user = ctx.request.user;
    let userExists = await UserTable.findOne({ _id: user._id });
    let userBank = await UserBanksTable.findOne({
      $and: [
        {
          _id: reqParam.bankId,
        },
        {
          userId: userExists._id,
        },
      ],
    });
    if (!userExists || (userExists && userExists.type == EUserType.TEEN)) {
      return this.BadRequest(ctx, "User not allowed to access");
    }
    return validation.recurringDepositValidation(
      reqParam,
      ctx,
      async (validate) => {
        if (validate) {
          if (userBank.isDefault !== 1) {
            await UserBanksTable.findOneAndUpdate(
              { _id: reqParam.bankId },
              {
                $set: {
                  isDefault: 1,
                },
              }
            );
            await UserBanksTable.updateMany(
              {
                $match: {
                  userId: userExists._id,
                  _id: {
                    $ne: reqParam.bankId,
                  },
                },
              },
              {
                $set: {
                  isDefault: 0,
                },
              }
            );
          }
          let scheduleDate = userService.getScheduleDate(reqParam.isRecurring);
          await UserTable.findOneAndUpdate(
            { _id: reqParam.childId },
            {
              $set: {
                isRecurring: reqParam.isRecurring,
                selectedDeposit:
                  reqParam.isRecurring == ERECURRING.NO_BANK ||
                  reqParam.isRecurring == ERECURRING.NO_RECURRING
                    ? 0
                    : reqParam.selectedDeposit,
                selectedDepositDate:
                  reqParam.isRecurring == ERECURRING.NO_BANK ||
                  reqParam.isRecurring == ERECURRING.NO_RECURRING
                    ? null
                    : scheduleDate,
              },
            }
          );
          /**
           * TODO:- Notification to be send
           */
          let message = "Auto deposit enabled!";
          if (
            reqParam.isRecurring == ERECURRING.NO_BANK ||
            reqParam.isRecurring == ERECURRING.NO_RECURRING
          ) {
            message = "Auto deposit disabled!";
          }
          return this.Ok(ctx, { message: message });
        }
      }
    );
  }

  /**
   * @description This method is used to reset crypto from staging
   * @param ctx
   * @return {*}
   */
  @Route({ path: "/add-crypto-from-pt", method: HttpMethod.DELETE })
  @PrimeTrustJWT()
  public async scriptClearTransaction(ctx: any) {
    let token = ctx.request.primeTrustToken;
    let assets: any = await getAssets(token, 1, 500);
    assets = await assets.data.data.filter(
      (x) =>
        x.attributes["unit-name"] === "BTC" ||
        x.attributes["unit-name"] === "ADA" ||
        x.attributes["unit-name"] === "SOL" ||
        x.attributes["unit-name"] === "ETH"
    );
    let array = [];
    for await (const iterator of assets) {
      array.push({
        name: iterator.attributes["name"],
        symbol: iterator.attributes["unit-name"],
        assetId: iterator.id,
      });
    }
    await CryptoTable.insertMany(array);

    return this.Ok(ctx, { message: assets });
  }

  /**
   * @description This method is used to switch bank account
   * @param ctx
   * @return {*}
   */
  @Route({ path: "/switch-bank-account-api/:bankId", method: HttpMethod.POST })
  @Auth()
  public async switchBankAccountApi(ctx: any) {
    const user = ctx.request.user;
    const { bankId } = ctx.request.params;
    return validation.switchBankAccountValidation(
      ctx.request.params,
      ctx,
      async (validate) => {
        if (validate) {
          const getBankList = await UserBanksTable.find({
            $or: [{ userId: user._id }, { parentId: user._id }],
          });
          if (getBankList) {
            const updatedToZero = await UserBanksTable.updateMany(
              {
                $match: {
                  _id: { $ne: bankId },
                  $or: [{ userId: user._id }, { parentId: user._id }],
                },
              },
              {
                $set: {
                  isDefault: 0,
                },
              }
            );
            if (updatedToZero) {
              await UserBanksTable.updateOne(
                {
                  _id: bankId,
                  $or: [{ userId: user._id }, { parentId: user._id }],
                },
                {
                  $set: {
                    isDefault: 1,
                  },
                }
              );
            }

            return this.Ok(ctx, { message: "Successfull" });
          } else {
            return this.BadRequest(ctx, "The Bank Account Does not exist");
          }
        }
      }
    );
  }

  /**
   * @description this method is used to unlink bank account
   * @params ctx
   * @return {*}
   */
  @Route({ path: "/unlink-bank", method: HttpMethod.POST })
  @Auth()
  public async unlinkBank(ctx: any) {
    let user = ctx.request.user;
    const { bankId } = ctx.request.body;
    /**
     * get user bank accessToken
     */
    const accessToken: any = await UserBankDBService.getUserBankAccessToken(
      user._id,
      bankId
    );

    return validation.unlinkBankValidation(
      ctx.request.body,
      ctx,
      async (validate) => {
        if (validate) {
          /**
           * service to unlink bank
           */

          const isBankUnlinked = await tradingService.unlinkBankService(
            accessToken
          );

          if (
            isBankUnlinked.status == 200 &&
            isBankUnlinked.data &&
            isBankUnlinked.data.request_id
          ) {
            await UserBanksTable.deleteOne({ _id: bankId });
            /**
             * upgrade recurring to no bank added
             */
            await UserDBService.updateUserRecurring(user._id);
            return this.Ok(ctx, { message: "Bank unlinked successfully" });
          }
        }
      }
    );
  }
}

export default new TradingController();
