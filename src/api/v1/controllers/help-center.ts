import Koa from "koa";
import BaseController from "./base";
import { Auth } from "@app/middleware";
import { validation } from "../../../validations/apiValidation";
import { Route } from "@app/utility";
import { HttpMethod } from "@app/types";
import { AdminTable } from "@app/model/admin";

class HelpCenterController extends BaseController {
  @Route({ path: "/send-issue", method: HttpMethod.POST })
  @Auth()
  public async sendIssue(ctx: Koa.Context) {
    const reqParam = ctx.request.body;
    return validation.sendIssueInputValidation(
      reqParam,
      ctx,
      async (validate) => {
        if (validate) {
          const { email, mobile } = reqParam;
          if (!email && !mobile)
            return this.BadRequest(ctx, "Email or Contact number not found.");
          return this.Ok(ctx, {
            message: "Hang tight! We will reach out to you ASAP",
          });
        }
      }
    );
  }
}

export default new HelpCenterController();
