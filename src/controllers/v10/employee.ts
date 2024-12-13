import { Auth } from "@app/middleware";
import { BusinessProfileTable, UserTable } from "@app/model";
import { HttpMethod } from "@app/types";
import { Route } from "@app/utility";
import BaseController from "../base";
import { EmployeeDBService } from "@app/services/v10";
class EmployeeController extends BaseController {
  /**
   * @description This is to fetch employee list
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/get-employees", method: HttpMethod.GET })
  @Auth()
  public async getEmployeeList(ctx: any) {
    const { user } = ctx.request;
    const [userExists, businessProfile] = await Promise.all([
      UserTable.findOne({ _id: user._id }),
      BusinessProfileTable.findOne({ userId: user._id }).lean(),
    ]);
    if (!userExists) {
      return this.BadRequest(ctx, "User Not Found");
    }
    const employees = await EmployeeDBService.getEmployeeList(
      userExists,
      businessProfile
    );
    return this.Ok(ctx, { data: employees });
  }
}

export default new EmployeeController();
