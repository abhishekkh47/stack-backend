import Koa from "koa";
import {
  createContributions,
  createProcessorToken,
  createPushTransferMethod,
  getPublicTokenExchange,
  Route,
  wireInboundMethod,
} from "@app/utility";
import BaseController from "./base";
import { Auth, PrimeTrustJWT } from "@app/middleware";
import {
  EAction,
  EStatus,
  ETRANSFER,
  EUserType,
  HttpMethod,
  messages,
} from "@app/types";
import {
  CryptoTable,
  ParentChildTable,
  UserActivityTable,
  UserTable,
} from "@app/model";
import { validation } from "../../../validations/apiValidation";
import { UserWalletTable } from "@app/model/userbalance";
import { ObjectId } from "mongodb";

class TradingController extends BaseController {
  /**
   * @description This method is used to add deposit for parent as well as teen
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/add-deposit", method: HttpMethod.POST })
  @PrimeTrustJWT()
  @Auth()
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
            console.log(contributionRequest, "contributionRequest");
            const contributions: any = await createContributions(
              jwtToken,
              contributionRequest
            );
            if (contributions.status == 400) {
              return this.BadRequest(ctx, contributions.message);
            }
            return this.Ok(ctx, contributions.data);
          } else if (reqParam.depositType == ETRANSFER.WIRE) {
            /**
             * Check if push transfer exists and move ahead else create
             */
            let pushTransferId = accountIdDetails.pushTransferId
              ? accountIdDetails.pushTransferId
              : null;
            if (accountIdDetails.pushTransferId == null) {
              const pushTransferRequest = {
                type: "push-transfer-methods",
                attributes: {
                  "account-id": accountIdDetails.accountId,
                  "contact-id": parentDetails.contactId,
                },
              };
              const pushTransferResponse: any = await createPushTransferMethod(
                jwtToken,
                pushTransferRequest
              );
              if (pushTransferResponse.status == 400) {
                return this.BadRequest(ctx, pushTransferResponse.message);
              }
              console.log(pushTransferResponse, "pushTransferResponse");
              pushTransferId = pushTransferResponse.data.id;
              await ParentChildTable.updateOne(
                {
                  userId: userExists._id,
                  "teens.childId": parentDetails.firstChildId,
                },
                {
                  $set: {
                    "teens.$.pushTransferId": pushTransferId,
                  },
                }
              );
            }
            /**
             * Create a wire transfer method respectively
             */
            // const wireRequest = {
            //   "push-transfer-method-id": pushTransferId,
            //   data: {
            //     type: "ach",
            //     attributes: {
            //       amount: reqParam.amount,
            //       reference: reqParam.amount,
            //     },
            //   },
            // };
            // const wireResponse: any = await wireInboundMethod(
            //   jwtToken,
            //   wireRequest,
            //   pushTransferId
            // );
            // if (wireResponse.status == 400) {
            //   return this.BadRequest(ctx, wireResponse.message);
            // }

            /**
             * For parent update the user balance directly
             */
            if (userExists.type === EUserType.PARENT) {
              return this.Created(ctx, {
                message:
                  "We are looking into your request and will proceed surely in some amount of time.",
              });
            }
          }
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
  public async withdrawMoney(ctx: any) {
    const user = ctx.request.user;
    const reqParam = ctx.request.body;
    const userExists = await UserTable.findOne({ _id: user._id });
    if (!userExists) {
      return this.BadRequest(ctx, "User Not Found");
    }
    return validation.withdrawMoneyValidation(
      reqParam,
      ctx,
      async (validate) => {
        if (validate) {
          /**
           * Check current balance is greather than withdrawable amount
           */
          const userBalance = await UserWalletTable.findOne({
            userId: userExists._id,
          });
          if (!userBalance || userBalance.balance < reqParam.amount) {
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
              userBalance.balance <
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
          /**
           * For parent update the user balance directly
           */
          if (userExists.type === EUserType.PARENT) {
            await UserWalletTable.updateOne(
              { userId: user._id },
              { $inc: { balance: -reqParam.amount } }
            );
            return this.Created(ctx, {
              message: "Amount Withdrawal Successfully to Bank",
            });
          }
          return this.Created(ctx, {
            message: `Your request for withdrawal of ${reqParam.amount} USD has been sent to your parent. Please wait while he/she approves it`,
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
  @Route({ path: "/pending-activity", method: HttpMethod.GET })
  @Auth()
  public async seePendingActivity(ctx: any) {
    const user = ctx.request.user;
    const userExists = await UserTable.findOne({ _id: user._id });
    if (!userExists) {
      return this.BadRequest(ctx, "User not Found");
    }
    const activities = await UserActivityTable.find(
      {
        userId: user._id,
        status: { $in: [EStatus.PENDING, EStatus.PROCESSED] },
      },
      {
        message: 1,
        action: 1,
        status: 1,
        currencyValue: 1,
      }
    ).sort({ updatedAt: -1 });
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
  public async checkBalance(ctx: any) {
    const user = ctx.request.user;
    const userBalance = await UserWalletTable.findOne(
      { userId: user._id },
      { balance: 1 }
    );
    return this.Ok(ctx, { balance: userBalance.balance });
  }

  /**
   * @description This method is used to buy crypto
   * @param ctx
   * @returns
   */
  @Route({ path: "/buy-crypto", method: HttpMethod.POST })
  @Auth()
  public async buyCrypto(ctx: any) {
    const user = ctx.request.user;
    const reqParam = ctx.request.body;
    return validation.buyCryptoValidation(reqParam, ctx, async (validate) => {
      const { amount, cryptoId } = reqParam;
      const crypto = await CryptoTable.findById({ _id: cryptoId });
      if (!crypto) return this.NotFound(ctx, "Crypto Not Found");

      const userBalance = (
        await UserWalletTable.findOne({ userId: user._id }, { balance: 1 })
      ).balance;
      if (amount > userBalance)
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
          userBalance < pendingTransactions[0].total + amount
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

    const teenActivities = await UserActivityTable.find(
      {
        userId: childId,
        status: { $in: [EStatus.PENDING, EStatus.PROCESSED] },
      },
      {
        message: 1,
        action: 1,
        status: 1,
        currencyValue: 1,
      }
    ).sort({ updatedAt: -1 });

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

    let isValid = true;
    for (let i = 0; i < parent.teens.length; i++) {
      if (parent.teens[i]["childId"] === activity.userId) {
        isValid = false;
        break;
      }
    }
    if (!isValid) return this.BadRequest(ctx, "Invalid Pending Activity ID");

    await UserActivityTable.updateOne(
      { _id: activityId },
      { status: EStatus.CANCELLED }
    );
    this.Ok(ctx, { message: "Activity cancelled out successfully" });
  }
}

export default new TradingController();
