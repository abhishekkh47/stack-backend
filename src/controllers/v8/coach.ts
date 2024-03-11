import BaseController from "@app/controllers/base";
import { Auth, PrimeTrustJWT } from "@app/middleware";
import { UserTable } from "@app/model";
import { CoachDBService } from "@app/services/v8";
import { HttpMethod } from "@app/types";
import { Route, COACH_REQUIREMENTS, THINGS_TO_TALK_ABOUT } from "@app/utility";

class CoachController extends BaseController {
  /**
   * @description This method is used to get coach requirements to be matched
   * @param ctx
   * @return {*}
   */
  @Route({ path: "/get-coach-requirements", method: HttpMethod.GET })
  @Auth()
  @PrimeTrustJWT(true)
  public async getCoachRequirements(ctx: any) {
    const { user } = ctx.request;
    const userIfExists = await UserTable.findOne({ _id: user._id });
    if (!userIfExists) {
      return this.BadRequest(ctx, "User not found.");
    }
    return this.Ok(ctx, { data: COACH_REQUIREMENTS });
  }

  /**
   * @description This method is used to get coach requirements to be matched
   * @param ctx
   * @return {*}
   */
  @Route({ path: "/get-coach-details", method: HttpMethod.GET })
  @Auth()
  @PrimeTrustJWT(true)
  public async getCoachDetails(ctx: any) {
    const { user, query } = ctx.request;
    const userIfExists = await UserTable.findOne({ _id: user._id });
    if (!userIfExists) {
      return this.BadRequest(ctx, "User not found.");
    }
    const coachProfile = await CoachDBService.getCoachRequirements(
      userIfExists,
      query
    );
    return this.Ok(ctx, {
      data: { coachProfile, thingsToTalkAbout: THINGS_TO_TALK_ABOUT },
    });
  }
}

export default new CoachController();
