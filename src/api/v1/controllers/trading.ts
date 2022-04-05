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
import { UserBalanceTable } from "@app/model/userbalance";

class TradingController extends BaseController {
  /**
   * @description This method is user to add deposit for parent as well as teen
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/add-deposit", method: HttpMethod.POST })
  @Auth()
  public async addDepositAction(ctx: any) {
    const user = ctx.request.user;
    const reqParam = ctx.request.body;
    return validation.addDepositValidation(reqParam, ctx, async (validate) => {
      if (validate) {
        const userExists = await UserTable.findOne({ _id: user._id });
        if (!userExists) {
          return this.BadRequest(ctx, "User Not Found");
        }
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
          await UserBalanceTable.updateOne(
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
}

export default new TradingController();
