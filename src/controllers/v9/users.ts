import BaseController from "@app/controllers/base";
import { Auth } from "@app/middleware";
import { UserDBService } from "@app/services/v6";
import { HttpMethod } from "@app/types";
import { Route, THINGS_TO_TALK_ABOUT } from "@app/utility";
import { BusinessProfileService } from "@app/services/v7";
import { CoachProfileTable, UserTable, LeagueTable } from "@app/model";
import { ChecklistDBService } from "@app/services/v9";
import { UserService } from "@app/services/v9";

class UserController extends BaseController {
  /**
   * @description This method is used to view profile for both parent and child
   * @param ctx
   */
  @Route({ path: "/get-profile/:id", method: HttpMethod.GET })
  @Auth()
  public async getProfile(ctx: any) {
    const { id } = ctx.request.params;
    const { user } = ctx.request;
    let coachProfile = null;
    let initialMessage = null;
    if (!/^[0-9a-fA-F]{24}$/.test(id))
      return this.BadRequest(ctx, "Enter valid ID.");
    const [userExists, userProfile, businessProfile, leagues] =
      await Promise.all([
        UserTable.findOne({ _id: user._id }),
        UserDBService.getProfile(id),
        BusinessProfileService.getBusinessProfile(id),
        LeagueTable.find(
          {},
          { _id: 0, name: 1, image: 1, colorCode: 1, minPoint: 1, maxPoint: 1 }
        ),
      ]);
    if (businessProfile && businessProfile?.businessCoachInfo?.coachId) {
      coachProfile = await CoachProfileTable.findOne({
        _id: businessProfile.businessCoachInfo.coachId,
      });
      initialMessage = businessProfile.businessCoachInfo.initialMessage;
    }
    const topicDetails = await ChecklistDBService.getQuizTopics(userExists);
    const userAIToolStatus = await UserService.userAIToolUsageStatus(
      userExists
    );
    let currentLeague = leagues.find(
      (x) =>
        x.minPoint <= userExists.xpPoints && x.maxPoint >= userExists.xpPoints
    );

    let data = {
      ...userProfile.data,
      currentLeague,
      businessProfile,
      assignedCoach: coachProfile
        ? {
            coachProfile,
            initialMessage,
            thingsToTalkAbout: THINGS_TO_TALK_ABOUT,
          }
        : null,
      topicDetails,
      userAIToolStatus,
    };

    return this.Ok(ctx, data, true);
  }
}

export default new UserController();
