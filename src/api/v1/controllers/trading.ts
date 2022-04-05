import Koa from "koa";
import mongoose from "mongoose";
import { get72HoursAhead, Route } from "@app/utility";
import BaseController from "./base";
import { Auth } from "@app/middleware";
import {
  EAction,
  EQuizTopicStatus,
  EStatus,
  EUserType,
  HttpMethod,
  messages,
} from "@app/types";
import { QuizTopicTable, UserActivityTable, UserTable } from "@app/model";
import { validation } from "../../../validations/apiValidation";
import moment from "moment";
import { UserWalletTable } from "@app/model/userbalance";

class TradingController extends BaseController {
  /**
   * @description This method is used to add deposit for parent as well as teen
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/add-deposit", method: HttpMethod.POST })
  @Auth()
  public async addDepositAction(ctx: any) {
    const user = ctx.request.user;
    const reqParam = ctx.request.body;
    const userExists = await UserTable.findOne({ _id: user._id });
    if (!userExists) {
      return this.BadRequest(ctx, "User Not Found");
    }
    return validation.addDepositValidation(reqParam, ctx, async (validate) => {
      if (validate) {
        /**
         * for teen it will be pending state and for parent it will be in approved
         */
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
        /**
         * For parent update the user balance directly
         */
        if (userExists.type === EUserType.PARENT) {
          await UserWalletTable.updateOne(
            { userId: user._id },
            { $inc: { balance: reqParam.amount } }
          );
          return this.Created(ctx, {
            message: "Amount Added Successfully to Bank",
          });
        }
        return this.Created(ctx, {
          message: `Your request for deposit of ${reqParam.amount} USD has been sent to your parent. Please wait while he/she approves it`,
        });
      }
    });
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
          if (!userBalance) {
            return this.BadRequest(
              ctx,
              "You dont have sufficient balance to withdraw money"
            );
          }
          if (userBalance.balance < reqParam.amount) {
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
}

export default new TradingController();
