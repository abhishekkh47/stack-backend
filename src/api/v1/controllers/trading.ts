import Koa from "koa";
import {
  createContributions,
  createDisbursements,
  createProcessorToken,
  createPushTransferMethod,
  getPublicTokenExchange,
  getBalance,
  Route,
  wireInboundMethod,
  generateQuote,
  executeQuote,
  getAccountId,
  getWireTransfer,
} from "../../../utility";
import BaseController from "./base";
import { Auth, PrimeTrustJWT } from "../../../middleware";
import {
  EAction,
  EStatus,
  ETransactionType,
  ETRANSFER,
  EUserType,
  HttpMethod,
  messages,
} from "../../../types";
import {
  CryptoTable,
  ParentChildTable,
  TransactionTable,
  UserActivityTable,
  UserTable,
} from "../../../model";
import { validation } from "../../../validations/apiValidation";
import { UserWalletTable } from "../../../model/userbalance";
import { ObjectId } from "mongodb";
import moment from "moment";

class TradingController extends BaseController {
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
    const jwtToken = ctx.request.primeTrustToken;
    const userExists = await UserTable.findOne({ _id: user._id });
    if (!userExists) {
      return this.BadRequest(ctx, "User Not Found");
    }
    return validation.addDepositValidation(
      reqParam,
      ctx,
      userExists.type,
      async (validate) => {
        if (validate) {
          /**
           * For teen it will be pending state
           */
          if (userExists.type === EUserType.TEEN) {
            await UserActivityTable.create({
              userId: userExists._id,
              userType: userExists.type,
              message: messages.DEPOSIT,
              currencyType: null,
              currencyValue: reqParam.amount,
              action: EAction.DEPOSIT,
              status:
                userExists.type === EUserType.TEEN
                  ? EStatus.PENDING
                  : EStatus.PROCESSED,
            });
            return this.Created(ctx, {
              message: `Your request for deposit of ${reqParam.amount} USD has been sent to your parent. Please wait while he/she approves it.`,
            });
          }
          /**
           * For parent check which type of transfer is done
           */
          const parentDetails: any = await ParentChildTable.findOne(
            {
              userId: new ObjectId(userExists._id),
            },
            {
              _id: 1,
              firstChildId: 1,
              contactId: 1,
              teens: 1,
            }
          );
          if (!parentDetails) {
            return this.BadRequest(ctx, "User Details Not Found");
          }
          const accountIdDetails = await parentDetails.teens.find(
            (x: any) =>
              x.childId.toString() == parentDetails.firstChildId.toString()
          );
          if (!accountIdDetails) {
            return this.BadRequest(ctx, "Account Details Not Found");
          }
          if (reqParam.depositType == ETRANSFER.ACH) {
            /**
             * get public token exchange
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
            await ParentChildTable.updateOne(
              {
                _id: parentDetails._id,
              },
              {
                $set: {
                  processorToken: processToken.data.processor_token,
                  accessToken: publicTokenExchange.data.access_token,
                },
              }
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
                  "plaid-processor-token": processToken.data.processor_token,
                },
                amount: reqParam.amount,
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
              userType: userExists.type,
              message: messages.DEPOSIT,
              currencyType: null,
              currencyValue: reqParam.amount,
              action: EAction.DEPOSIT,
              resourceId: contributions.data.included[0].id,
              status: EStatus.PENDING,
            });
            return this.Created(ctx, {
              message: `We are looking into your request and will proceed surely in some amount of time.`,
              data: contributions.data,
            });
          }
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
          //     console.log(pushTransferResponse, "pushTransferResponse");
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
              ? { userId: ctx.request.user._id }
              : { "teens.childId": ctx.request.user._id };
          let parent: any = await ParentChildTable.findOne(query);
          if (!parent) return this.BadRequest(ctx, "Invalid User");
          // const userBalance = await UserWalletTable.findOne(
          //   { userId: user._id },
          //   { balance: 1 }
          // );
          const accountIdDetails = await parent.teens.find(
            (x: any) => x.childId.toString() == parent.firstChildId.toString()
          );
          if (!accountIdDetails) {
            return this.BadRequest(ctx, "Account Details Not Found");
          }
          const fetchBalance: any = await getBalance(
            jwtToken,
            parent.teens[0].accountId
          );
          if (fetchBalance.status == 400) {
            return this.BadRequest(ctx, fetchBalance.message);
          }
          const balance = fetchBalance.data.data[0].attributes.disbursable;
          const userBalance = await UserWalletTable.findOne({
            userId: userExists._id,
          });
          if (!userBalance || balance < reqParam.amount) {
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
          /**
           * for teen it will be pending state and for parent it will be in approved
           */
          if (userExists.type == EUserType.TEEN) {
            await UserActivityTable.create({
              userId: userExists._id,
              userType: userExists.type,
              message: messages.WITHDRAW,
              currencyType: null,
              currencyValue: reqParam.amount,
              action: EAction.WITHDRAW,
              status:
                userExists.type === EUserType.TEEN
                  ? EStatus.PENDING
                  : EStatus.PROCESSED,
            });
            return this.Created(ctx, {
              message: `Your request for withdrawal of ${reqParam.amount} USD has been sent to your parent. Please wait while he/she approves it`,
            });
          }
          if (reqParam.withdrawType != ETRANSFER.ACH) {
            return this.BadRequest(ctx, "Please select ach as transfer method");
          }
          /**
           * For parent create disbursement code of prime trust with plaid processor token
           */
          if (userExists.type === EUserType.PARENT) {
            const parentDetails: any = await ParentChildTable.findOne(
              {
                userId: new ObjectId(userExists._id),
              },
              {
                _id: 1,
                firstChildId: 1,
                contactId: 1,
                teens: 1,
              }
            );
            if (!parentDetails) {
              return this.BadRequest(ctx, "User Details Not Found");
            }
            const accountIdDetails = await parentDetails.teens.find(
              (x: any) =>
                x.childId.toString() == parentDetails.firstChildId.toString()
            );
            if (!accountIdDetails) {
              return this.BadRequest(ctx, "Account Details Not Found");
            }
            /**
             * get public token exchange
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
                  "plaid-processor-token": processToken.data.processor_token,
                },
                amount: reqParam.amount,
              },
            };
            const disbursement: any = await createDisbursements(
              jwtToken,
              disbursementRequest
            );
            if (disbursement.status == 400) {
              return this.BadRequest(ctx, disbursement.message);
            }
            return this.Created(ctx, {
              message: "Amount Withdrawal Successfully to Bank",
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
          // status: { $in: [EStatus.PENDING, EStatus.PROCESSED] },
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
            { $set: { status: EStatus.CANCELLED } }
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
    const jwtToken = ctx.request.primeTrustToken;
    const userExists = await UserTable.findOne({ _id: user._id });
    if (!userExists) {
      return this.BadRequest(ctx, "User Not Found");
    }
    const query =
      userExists.type == EUserType.PARENT
        ? { userId: ctx.request.user._id }
        : { "teens.childId": ctx.request.user._id };
    let parent: any = await ParentChildTable.findOne(query);
    if (!parent) return this.BadRequest(ctx, "Invalid User");
    // const userBalance = await UserWalletTable.findOne(
    //   { userId: user._id },
    //   { balance: 1 }
    // );
    const accountIdDetails = await parent.teens.find(
      (x: any) => x.childId.toString() == parent.firstChildId.toString()
    );
    if (!accountIdDetails) {
      return this.BadRequest(ctx, "Account Details Not Found");
    }
    const fetchBalance: any = await getBalance(
      jwtToken,
      parent.teens[0].accountId
    );
    if (fetchBalance.status == 400) {
      return this.BadRequest(ctx, fetchBalance.message);
    }
    const balance = fetchBalance.data.data[0].attributes.disbursable;
    if (fetchBalance.status == 400) {
      return this.BadRequest(ctx, fetchBalance.message);
    }
    return this.Ok(ctx, { balance: balance });
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
          ? { userId: ctx.request.user._id }
          : { "teens.childId": ctx.request.user._id };
      let parent: any = await ParentChildTable.findOne(query);
      if (!parent) return this.BadRequest(ctx, "Invalid User");
      // const userBalance = await UserWalletTable.findOne(
      //   { userId: user._id },
      //   { balance: 1 }
      // );
      const accountIdDetails = await parent.teens.find(
        (x: any) => x.childId.toString() == parent.firstChildId.toString()
      );
      if (!accountIdDetails) {
        return this.BadRequest(ctx, "Account Details Not Found");
      }
      const fetchBalance: any = await getBalance(
        jwtToken,
        parent.teens[0].accountId
      );
      if (fetchBalance.status == 400) {
        return this.BadRequest(ctx, fetchBalance.message);
      }
      const balance = fetchBalance.data.data[0].attributes.disbursable;
      // const userBalance = (
      //   await UserWalletTable.findOne({ userId: user._id }, { balance: 1 })
      // ).balance;
      if (amount > balance)
        return this.BadRequest(
          ctx,
          "You dont have sufficient balance to buy cryptocurrenices"
        );

      const userType = (
        await UserTable.findOne(
          { username: user.username },
          { type: 1, _id: -1 }
        )
      ).type;

      if (userType === EUserType.TEEN) {
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
            "Please cancel your existing request in order to withdraw money from this request"
          );
        }
      }

      await UserActivityTable.create({
        userId: user._id,
        message: messages.BUY,
        action: EAction.BUY_CRYPTO,
        currencyValue: amount,
        currencyType: cryptoId,
        cryptoId: cryptoId,
        userType,
        status:
          userType === EUserType.TEEN ? EStatus.PENDING : EStatus.PROCESSED,
      });
      const message =
        userType === EUserType.TEEN
          ? `Your request for buy order of crypto of ${reqParam.amount} USD has been sent to your parent. Please wait while he/she approves it`
          : `Buy order proccessed`;

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
  public async sellCrypto(ctx: any) {
    const user = ctx.request.user;
    const reqParam = ctx.request.body;
    return validation.sellCryptoValidation(reqParam, ctx, async (validate) => {
      const { amount, cryptoId } = reqParam;
      const crypto = await CryptoTable.findById({ _id: cryptoId });
      if (!crypto) return this.NotFound(ctx, "Crypto Not Found");

      const userType = (
        await UserTable.findOne(
          { username: user.username },
          { type: 1, _id: -1 }
        )
      ).type;

      await UserActivityTable.create({
        userId: user._id,
        message: messages.SELL,
        action: EAction.SELL_CRYPTO,
        currencyValue: amount,
        currencyType: cryptoId,
        cryptoId: cryptoId,
        userType,
        status:
          userType === EUserType.TEEN ? EStatus.PENDING : EStatus.PROCESSED,
      });
      const message =
        userType === EUserType.TEEN
          ? `Your request for sell order of crypto of ${reqParam.amount} USD has been sent to your parent. Please wait while he/she approves it`
          : `Sell order proccessed`;

      return this.Ok(ctx, { message });
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
    const parent = await ParentChildTable.findOne({
      userId: ctx.request.user._id,
    });
    if (!parent) return this.BadRequest(ctx, "Invalid Parent's ID");
    let teen: any;
    parent.teens.forEach((current: any) => {
      if (current.childId.toString() === childId) teen = current;
    });
    if (!teen) this.BadRequest(ctx, "Invalid Child ID");

    const teenActivities = await UserActivityTable.aggregate([
      {
        $match: {
          userId: new ObjectId(childId),
          // status: { $in: [EStatus.PENDING, EStatus.PROCESSED] },
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
      data: { pending: pendingActivity, processed: processedActivity },
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
    if (!/^[0-9a-fA-F]{24}$/.test(activityId))
      return this.BadRequest(ctx, "Enter Correct Activity Details");
    const parent = await ParentChildTable.findOne({
      userId: ctx.request.user._id,
    });
    if (!parent) return this.BadRequest(ctx, "Invalid Parent's ID");

    const activity = await UserActivityTable.findOne(
      { _id: activityId, status: EStatus.PENDING },
      { userId: 1 }
    );
    if (!activity) return this.BadRequest(ctx, "Invalid Pending Activity ID");

    await UserActivityTable.updateOne(
      { _id: activityId },
      {
        status: EStatus.CANCELLED,
        message:
          activity.action == EAction.DEPOSIT
            ? messages.REJECT_DEPOSIT
            : activity.action == EAction.WITHDRAW
            ? messages.REJECT_WITHDRAW
            : activity.action == EAction.BUY_CRYPTO
            ? messages.REJECT_BUY
            : messages.REJECT_SELL,
      }
    );

    return this.Ok(ctx, { message: "Activity cancelled out successfully" });
  }

  /**
   * @description This method is used to get portfolio for child account
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/get-portfolio", method: HttpMethod.POST })
  @Auth()
  @PrimeTrustJWT()
  public async getPortfolio(ctx: any) {}

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
    if (balance < activity.currencyValue) {
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
          { status: EStatus.PROCESSED, message: messages.APPROVE_DEPOSIT }
        );
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
          { status: EStatus.PROCESSED, message: messages.APPROVE_WITHDRAW }
        );
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
              hot: false,
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
          userId: accountIdDetails.childId,
          parentId: userExists._id,
          unitCount: executeQuoteResponse.data.data.attributes["unit-count"],
        });
        await UserActivityTable.updateOne(
          { _id: activityId },
          { status: EStatus.PROCESSED, message: messages.APPROVE_BUY }
        );
        return this.Ok(ctx, {
          message: "Success",
          data: "You have approved teen's request of buying crypto. Please wait while it settles in the portfolio respectively.",
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
        /**
         * Generate a quote
         */
        const requestSellQuoteDay: any = {
          data: {
            type: "quotes",
            attributes: {
              "account-id": accountIdDetails.accountId,
              "asset-id": sellCryptoData.assetId,
              hot: false,
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
          userId: accountIdDetails.childId,
          parentId: userExists._id,
          unitCount:
            executeSellQuoteResponse.data.data.attributes["unit-count"],
        });
        await UserActivityTable.updateOne(
          { _id: activityId },
          { status: EStatus.PROCESSED, message: messages.APPROVE_SELL }
        );
        return this.Ok(ctx, {
          message: "Success",
          data: "You have approved teen's request of selling crypto. Please wait while it settles in the portfolio respectively.",
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
}

export default new TradingController();
