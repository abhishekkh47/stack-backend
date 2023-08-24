import { Auth } from "@app/middleware";
import { StreakGoalTable, UserTable, BusinessProfileTable } from "@app/model";
import { BusinessProfileService } from "@app/services/v4";
import { HttpMethod } from "@app/types";
import { Route } from "@app/utility";
import { validationsV4 } from "@app/validations/v4/apiValidation";
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

  /**
   * @description This method is commit to the streak goals
   * @param ctx
   * @returns {*}
   */
  @Route({
    path: "/streakgoals/commit",
    method: HttpMethod.POST,
  })
  @Auth()
  public async commitToStreakGoals(ctx: any) {
    try {
      const { user, body } = ctx.request;
      const userIfExists = await UserTable.findOne({ _id: user._id });
      if (!userIfExists) {
        return this.BadRequest(ctx, "User not found");
      }
      return validationsV4.commitGoalValidation(
        body,
        ctx,
        async (validate: boolean) => {
          if (validate) {
            await BusinessProfileService.setStreakGoals(
              userIfExists._id,
              body.streakGoalId
            );
            return this.Ok(ctx, { message: "You have commited your goal" });
          }
        }
      );
    } catch (error) {
      return this.BadRequest(ctx, error.message);
    }
  }
}

export default new StreaksController();
