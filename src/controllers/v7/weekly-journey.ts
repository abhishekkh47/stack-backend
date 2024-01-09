import BaseController from "@app/controllers/base";
import { Auth } from "@app/middleware";
import { UserTable } from "@app/model";
import { WeeklyJourneyTable, WeeklyJourneyResultTable } from "@app/model";
import { WeeklyJourneyDBService } from "@app/services/v7";
import { HttpMethod } from "@app/types";
import { Route } from "@app/utility";

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
          .select("_id day week dailyGoal actions reward rewardType title"),
        WeeklyJourneyResultTable.find({ userId: user._id }).sort({
          createdAt: -1,
        }),
      ]);
    if (!userIfExists) return this.BadRequest(ctx, "User not found");
    if (!weeklyJourneyDetails)
      return this.BadRequest(ctx, "weeklyJourneyDetails not found");

    const userNextChallenge = await WeeklyJourneyDBService.getUserNextChallenge(
      user._id,
      weeklyJourneyDetails,
      userProgress
    );
    const getWeeklyDetails = await WeeklyJourneyDBService.getWeekDetails(
      weeklyJourneyDetails,
      userNextChallenge
    );
    return this.Ok(ctx, {
      data: { weeks: getWeeklyDetails, currentDay: userNextChallenge },
      message: "Success",
    });
  }

  @Route({ path: "/claim-weekly-reward", method: HttpMethod.POST })
  @Auth()
  public async claimWeeklyReward(ctx: any) {
    const { user } = ctx.request;
    const reqParam = ctx.request.body;
    const userIfExists = await UserTable.findOne({ _id: user._id });
    if (!userIfExists) return this.BadRequest(ctx, "User not found");

    await WeeklyJourneyDBService.storeWeeklyReward(user._id, reqParam);
    return this.Ok(ctx, {
      message: "Success",
    });
  }
}

export default new WeeklyJourneyController();
