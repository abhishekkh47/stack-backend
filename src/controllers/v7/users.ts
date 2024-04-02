import BaseController from "@app/controllers/base";
import { Auth } from "@app/middleware";
import { UserDBService } from "@app/services/v6";
import { HttpMethod } from "@app/types";
import { Route, THINGS_TO_TALK_ABOUT } from "@app/utility";
import { BusinessProfileService } from "@app/services/v7";
import { CoachProfileTable } from "@app/model";

class UserController extends BaseController {
  /**
   * @description This method is used to view profile for both parent and child
   * @param ctx
   */
  @Route({ path: "/get-profile/:id", method: HttpMethod.GET })
  @Auth()
  public async getProfile(ctx: any) {
    const { id } = ctx.request.params;
    let coachProfile = null;
    let initialMessage = null;
    if (!/^[0-9a-fA-F]{24}$/.test(id))
      return this.BadRequest(ctx, "Enter valid ID.");
    let { data } = await UserDBService.getProfile(id);
    const businessProfile = await BusinessProfileService.getBusinessProfile(id);
    if (businessProfile && businessProfile?.businessCoachInfo?.coachId) {
      coachProfile = await CoachProfileTable.findOne({
        _id: businessProfile.businessCoachInfo.coachId,
      });
      initialMessage = businessProfile.businessCoachInfo.initialMessage;
    }

    data = {
      ...data,
      businessProfile,
      assignedCoach: coachProfile
        ? {
            coachProfile,
            initialMessage,
            thingsToTalkAbout: THINGS_TO_TALK_ABOUT,
          }
        : null,
    };

    return this.Ok(ctx, data, true);
  }
}

export default new UserController();
