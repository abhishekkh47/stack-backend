import { Auth } from "@app/middleware";
import { BusinessProfileTable, UserTable } from "@app/model";
import { HttpMethod } from "@app/types";
import { Route, DEFAULT_BUSINESS_SCORE } from "@app/utility";
import BaseController from "../base";
import { EmployeeDBService } from "@app/services/v10";
import { UserDBService as UserDBServiceV6 } from "@app/services/v6";
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
    const [employees, stageColorInfo, stageDetails] = await Promise.all([
      EmployeeDBService.getEmployeeList(userExists, businessProfile),
      UserDBServiceV6.getStageColorInfo(userExists),
      UserDBServiceV6.getStageInfoUsingStageId(userExists),
    ]);
    return this.Ok(ctx, {
      data: {
        employees,
        colorInfo: stageColorInfo?.colorInfo?.homepage?.outer,
        stageName: stageDetails?.title,
        currentScore:
          userExists?.businessScore?.currentScore || DEFAULT_BUSINESS_SCORE,
      },
    });
  }
}

export default new EmployeeController();
