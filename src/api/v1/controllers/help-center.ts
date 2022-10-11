import Koa from "koa";
import BaseController from "./base";
import { validation } from "../../../validations/apiValidation";
import { Route, sendEmail } from "../../../utility";
import { HttpMethod } from "../../../types";
import { AdminTable, UserTable } from "../../../model";
import { CONSTANT } from "../../../utility/constants";
import { Auth } from "@app/middleware";

class HelpCenterController extends BaseController {
  @Route({ path: "/send-issue", method: HttpMethod.POST })
  @Auth()
  public async sendIssue(ctx: any) {
    const reqParam = ctx.request.body;
    const user = ctx.request.user;
    return validation.sendIssueInputValidation(
      reqParam,
      ctx,
      async (validate) => {
        if (validate) {
          const { issue } = reqParam;
          const userInfo = await UserTable.findById({_id: user._id}) 
          if (!userInfo.email && !userInfo.mobile)
            return this.BadRequest(ctx, "Email or Contact number not found.");

          let userType: any;
          if (userInfo.email)
            userType = await UserTable.findOne({ email: userInfo.email }, { type: 1, _id: 0 });
          else
            userType = await UserTable.findOne({ mobile: userInfo.mobile }, { type: 1, _id: 0 });

          if (!userType)
            return this.BadRequest(ctx, "User with such details not found");

          /**
           * Send email regarding the details to admin
           */
          const data = {
            email: userInfo.email ? userInfo.email : "N/A",
            mobile: userInfo.mobile ? userInfo.mobile : "N/A",
            type: userType.type == 1 ? "TEEN" : userType.type == 2 ? "PARENT" : "SELF",
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
