import BaseController from "@app/controllers/base";
import { Auth } from "@app/middleware";
import { UserTable } from "@app/model";
import { WeeklyJourneyTable, WeeklyJourneyResultsTable } from "@app/model";
import { WeeklyJourneyDBService } from "@app/services/v7";
import { HttpMethod } from "@app/types";
import { Route, searchSchools } from "@app/utility";
import { BusinessProfileService } from "@app/services/v4";
import { validationsV4 } from "@app/validations/v4/apiValidation";

class WeeklyJourneyController extends BaseController {
  /**
   * @description This method is used to get weekly journey details and the user progress
   * @param ctx
   */
  @Route({ path: "/get-weekly-journey", method: HttpMethod.GET })
  @Auth()
  public async getWeeklyJourney(ctx: any) {
    const { user } = ctx.request;
    const [userIfExists, weeklyJourneyDetails, userProgress] =
      await Promise.all([
        UserTable.findOne({ _id: user._id }),
        WeeklyJourneyTable.find({})
          .sort({ week: 1, day: 1 })
          .select("_id day week actions reward rewardType title"),
        WeeklyJourneyResultsTable.find({ userId: user._id }).sort({
          createdAt: -1,
        }),
      ]);
    if (!userIfExists) return this.BadRequest(ctx, "User not found");
    let userNextChallenge = await WeeklyJourneyDBService.getUserNextChallenge(
      user._id,
      weeklyJourneyDetails,
      userProgress
    );
    return this.Ok(ctx, {
      data: userNextChallenge,
      message: "Success",
    });
  }
}

export default new WeeklyJourneyController();
