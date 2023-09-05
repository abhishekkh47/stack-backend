import { Auth } from "@app/middleware";
import { StreakGoalTable } from "@app/model";
import { HttpMethod } from "@app/types";
import { Route } from "@app/utility";
import BaseController from "../base";

class StreaksController extends BaseController {
  /**
   * @description This method is get streakgoals
   * @returns {*}
   */
  @Route({
    path: "/streakgoals",
    method: HttpMethod.GET,
  })
  @Auth()
  public async getStreakGoals(ctx: any) {
    const streakGoals = await StreakGoalTable.find({})
      .select("_id day title")
      .sort({ day: 1 });
    return this.Ok(ctx, { message: "Success", data: streakGoals });
  }
}

export default new StreaksController();
