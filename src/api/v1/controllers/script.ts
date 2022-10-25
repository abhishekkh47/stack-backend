import { UserTable } from "../../../model";
import { HttpMethod } from "../../../types";
import { Route } from "../../../utility";
import BaseController from "./base";

class ScriptController extends BaseController {
  /**
   * @description This method is for updating screen status by script for migration into production
   * @param ctx
   * @returns
   */
  @Route({ path: "/update-screen-status-script", method: HttpMethod.POST })
  public async updateScreenStatusScript(ctx: any) {
    const reqParam = ctx.request.body;
    const { email } = reqParam;

    const attachEmail = (query) => email ? {
      $and: [query, { email }]
    } : query;

    /**
     * Screen status 0 ,1 ,2 to 0
     */
    const updatedCount1 = await UserTable.updateMany(
      attachEmail({ screenStatus: { $in: [0, 1, 2] } }),
      {
        $set: {
          screenStatus: 0,
        },
      }
    );
    /**
     * Screen status 5 to 7
     */
    const updatedCount2 = await UserTable.updateMany(
      attachEmail({ screenStatus: 5 }),
      {
        $set: {
          screenStatus: 7,
        },
      }
    );
    /**
     * Screen status 3 to 5
     */
    const updatedCount3 = await UserTable.updateMany(
      attachEmail({ screenStatus: 3 }),
      {
        $set: {
          screenStatus: 5,
        },
      }
    );
    /**
     * Screen status 4 to 6
     */
    const updatedCount4 = await UserTable.updateMany(
      attachEmail({ screenStatus: 4 }),
      {
        $set: {
          screenStatus: 6,
        },
      }
    );
    return this.Ok(ctx, {
      updatedCount1,
      updatedCount2,
      updatedCount3,
      updatedCount4,
    });
  }
}

export default new ScriptController();
