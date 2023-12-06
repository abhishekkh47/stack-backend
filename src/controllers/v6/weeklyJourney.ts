import BaseController from "@app/controllers/base";
import { Auth } from "@app/middleware";
import { UserTable } from "@app/model";
import { WeeklyJourneyTable, WeeklyJourneyResultsTable, BusinessProfileTable } from "@app/model";
import { WeeklyJourneyDBService } from "@app/services/v6";
import { HttpMethod } from "@app/types";
import { Route, searchSchools } from "@app/utility";
import { validationsV4 } from "@app/validations/v4/apiValidation";

class WeeklyJourneyController extends BaseController {
  /**
   * @description This method is used to get weekly journey details and the user progress
   * @param ctx
   */
  @Route({ path: "/get-weekly-journey", method: HttpMethod.POST })
  @Auth()
  public async getWeeklyJourney(ctx: any) {
    const { user } = ctx.request;
    const [userIfExists, weeklyJourneyDetails, userProgress] =
      await Promise.all([
        UserTable.findOne({ _id: user._id }),
        WeeklyJourneyTable.find({}),
        WeeklyJourneyResultsTable.find({ userid: user._id }).sort({
          createdAt: -1,
        }),
      ]);
    if (!userIfExists) return this.BadRequest(ctx, "User not found");
    const userNextChallenge = await WeeklyJourneyDBService.getUserNextChallenge(
      userProgress
    );
    return this.Ok(ctx, {
      data: [weeklyJourneyDetails, userNextChallenge],
      message: "Success",
    });
  }

  /**
   * @description This method is used to get weekly journey details and the user progress
   * @param ctx
   */
  @Route({ path: "/add-to-profile", method: HttpMethod.POST })
  @Auth()
  public async addToProfile(ctx: any){
    const { user, body } = ctx.request;
    const userIfExists = await UserTable.findOne({ _id: user._id });
    if (!userIfExists) return this.BadRequest(ctx, "User not found");
  }
}

export default new WeeklyJourneyController();
