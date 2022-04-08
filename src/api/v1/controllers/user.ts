import Koa from "koa";
import BaseController from "./base";
import { Auth } from "@app/middleware";
import { validation } from "@app/validations/apiValidation";
import { UserTable } from "@app/model";
import { Route } from "@app/utility";
import { HttpMethod } from "@app/types";

class UserController extends BaseController {
  @Route({ path: "/update-tax-info", method: HttpMethod.POST })
  @Auth()
  public async updateTaxInfo(ctx: any) {
    const input = ctx.request.body;
    return validation.updateTaxInfoRequestBodyValidation(
      input,
      ctx,
      async (validate) => {
        if (validate) {
          await UserTable.updateOne(
            { username: ctx.request.user.username },
            {
              $set: {
                taxIdNo: input.taxIdNo,
                taxState: input.taxState,
              },
            }
          );
          return this.Ok(ctx, { message: "Tax info updated successfully." });
        }
      }
    );
  }
}

export default new UserController();
