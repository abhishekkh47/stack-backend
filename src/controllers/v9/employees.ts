import { Auth } from "@app/middleware";
import { UserTable } from "@app/model";
import { HttpMethod } from "@app/types";
import { Route } from "@app/utility";
import BaseController from "../base";
import { EmployeeDBService } from "@app/services/v9";
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
    const userExists = await UserTable.findOne({ _id: user._id });
    if (!userExists) {
      return this.BadRequest(ctx, "User Not Found");
    }
    const employees = await EmployeeDBService.getEmployeeList(userExists);
    return this.Ok(ctx, {
      data: employees,
    });
  }

  /**
   * @description This is to employee details
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/get-employee-details/:id", method: HttpMethod.GET })
  @Auth()
  public async getEmployeeDetails(ctx: any) {
    const { user, params } = ctx.request;
    const { id } = params;
    const userExists = await UserTable.findOne({ _id: user._id });
    if (!userExists) {
      return this.BadRequest(ctx, "User Not Found");
    }
    const employees = await EmployeeDBService.getEmployeeDetails(
      userExists,
      id
    );
    return this.Ok(ctx, {
      data: employees,
    });
  }
}

export default new EmployeeController();
