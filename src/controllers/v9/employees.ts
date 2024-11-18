import { Auth } from "@app/middleware";
import { BusinessProfileTable, UserTable } from "@app/model";
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
    return this.Ok(ctx, {
      data: employees,
    });
  }

  /**
   * @description This is to get employee details
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

  /**
   * @description This is to unlock the employee and add it to userEmployees collection
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/unlock-employee", method: HttpMethod.POST })
  @Auth()
  public async unlockEmployee(ctx: any) {
    const { user, body } = ctx.request;
    const { employeeId, employees } = body;
    const userExists = await UserTable.findOne({ _id: user._id });
    if (!userExists) {
      return this.BadRequest(ctx, "User Not Found");
    }
    const employeesDetails = await EmployeeDBService.unlockEmployee(
      userExists,
      employeeId,
      1
    );
    return this.Ok(ctx, {
      data: employeesDetails,
    });
  }

  /**
   * @description This is to hire an unlocked employee from the marketplace
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/hire-employee", method: HttpMethod.POST })
  @Auth()
  public async hireEmployee(ctx: any) {
    const { user, body } = ctx.request;
    const { employeeId } = body;
    const userExists = await UserTable.findOne({ _id: user._id });
    if (!userExists) {
      return this.BadRequest(ctx, "User Not Found");
    }
    const employees = await EmployeeDBService.hireEmployee(
      userExists,
      employeeId
    );
    return this.Ok(ctx, {
      data: employees,
    });
  }

  /**
   * @description This is to get projects which can be completed by an employee
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/get-employee-projects/:id", method: HttpMethod.GET })
  @Auth()
  public async getEmployeeProjects(ctx: any) {
    const { user, params } = ctx.request;
    const { id } = params;
    const userExists = await UserTable.findOne({ _id: user._id });
    if (!userExists) {
      return this.BadRequest(ctx, "User Not Found");
    }
    const projects = await EmployeeDBService.getEmployeeProjects(
      userExists,
      id
    );
    return this.Ok(ctx, {
      data: projects,
    });
  }

  /**
   * @description This is to start a project for an employee
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/start-project", method: HttpMethod.POST })
  @Auth()
  public async startProject(ctx: any) {
    const { user, body } = ctx.request;
    const userExists = await UserTable.findOne({ _id: user._id });
    if (!userExists) {
      return this.BadRequest(ctx, "User Not Found");
    }
    await EmployeeDBService.startEmployeeProject(userExists, body);
    return this.Ok(ctx, {
      message: "success",
    });
  }

  /**
   * @description This is to complete the project and claim reward
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/complete-project", method: HttpMethod.POST })
  @Auth()
  public async completeProject(ctx: any) {
    const { user, body } = ctx.request;
    const userExists = await UserTable.findOne({ _id: user._id });
    if (!userExists) {
      return this.BadRequest(ctx, "User Not Found");
    }
    await EmployeeDBService.completeProjectAndClaimReward(userExists, body);
    return this.Ok(ctx, {
      message: "success",
    });
  }
}

export default new EmployeeController();
