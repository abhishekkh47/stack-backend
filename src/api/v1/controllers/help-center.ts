import Koa from "koa";
import BaseController from "./base";
import { validation } from "../../../validations/apiValidation";
import { Route, sendEmail } from "../../../utility";
import { HttpMethod } from "../../../types";
import { AdminTable, UserTable } from "../../../model";
import { CONSTANT } from "../../../utility/constants";

class HelpCenterController extends BaseController {
  @Route({ path: "/send-issue", method: HttpMethod.POST })
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

          let userType: any;
          if (email)
            userType = await UserTable.findOne({ email }, { type: 1, _id: 0 });
          else
            userType = await UserTable.findOne({ mobile }, { type: 1, _id: 0 });

          if (!userType)
            return this.BadRequest(ctx, "User with such details not found");

          /**
           * Send email regarding the details to admin
           */
          const data = {
            email: email ? email : "N/A",
            mobile: mobile ? mobile : "N/A",
            type: userType.type == 1 ? "TEEN" : "PARENT",
            issue,
            subject: "Help Center Request",
          };
          const admin = await AdminTable.findOne({});
          sendEmail(admin.email, CONSTANT.HelpCenterTemplateId, data);
          return this.Ok(ctx, {
            message: "Hang tight! We will reach out to you ASAP",
          });
        }
      }
    );
  }
}

export default new HelpCenterController();
