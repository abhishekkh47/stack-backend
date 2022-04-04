import Koa from "koa";
import BaseController from "./base";
import { Auth } from "@app/middleware";
import { validation } from "../../../validations/apiValidation";
import { Route, sendEmail } from "@app/utility";
import { HttpMethod } from "@app/types";
import { AdminTable } from "@app/model";
import { CONSTANT } from "@app/utility/constants";

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
          const { email, mobile, issue } = reqParam;
          if (!email && !mobile)
            return this.BadRequest(ctx, "Email or Contact number not found.");
          /**
           * Send email regarding the details to admin
           */
          const data = {
            email: email ? email : "N/A",
            mobile: mobile ? mobile : "N/A",
            issue,
            subject: "Help Center Request",
          };
          const admin = await AdminTable.findOne({});
          await sendEmail(admin.email, CONSTANT.HelpCenterTemplateId, data);
          return this.Ok(ctx, {
            message: "Hang tight! We will reach out to you ASAP",
          });
        }
      }
    );
  }
}

export default new HelpCenterController();
