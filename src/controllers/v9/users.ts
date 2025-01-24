import BaseController from "@app/controllers/base";
import { Auth } from "@app/middleware";
import { UserDBService } from "@app/services/v6";
import { HttpMethod } from "@app/types";
import {
  Route,
  THINGS_TO_TALK_ABOUT,
  INITIAL_TUTORIAL_STATUS,
  TUTORIAL_LOOKUP,
} from "@app/utility";
import { BusinessProfileService as BusinessProfileServiceV9 } from "@app/services/v9";
import {
  CoachProfileTable,
  UserTable,
  LeagueTable,
  TutorialStatusTable,
} from "@app/model";
import { ChecklistDBService } from "@app/services/v9";
import { UserService } from "@app/services/v9";
import {
  EmployeeDBService as EmployeeDBServiceV10,
  DripshopDBService,
} from "@app/services/v10";

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
    const userIfExists = await UserTable.findOne({ _id: user._id });
    if (!userIfExists) {
      return this.UnAuthorized(ctx, "User Not Found");
    }
    let coachProfile = null;
    let initialMessage = null;
    if (!/^[0-9a-fA-F]{24}$/.test(id))
      return this.BadRequest(ctx, "Enter valid ID.");
    const [userExists, userProfile, businessProfile, leagues] =
      await Promise.all([
        UserTable.findOne({ _id: id }),
        UserDBService.getProfile(id),
        BusinessProfileServiceV9.getBusinessProfile(id),
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
    const [
      topicDetails,
      userAIToolStatus,
      _,
      showEmpNotification,
      ifStreakGiftAvailable,
    ] = await Promise.all([
      ChecklistDBService.getQuizTopics(userExists),
      UserService.userAIToolUsageStatus(userExists),
      UserDBService.resetCurrentDayRewards(userExists),
      EmployeeDBServiceV10.ifEmployeeNotificationAvailable(
        userExists,
        businessProfile
      ),
      DripshopDBService.ifStreakRewardAvailable(userExists),
    ]);
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
      userAIToolStatus: userAIToolStatus || {},
      showEmpNotification,
      isDailyGiftPendingToClaim: ifStreakGiftAvailable?.available,
      isDailyGiftAvailableIn: ifStreakGiftAvailable?.streakRewardAvailableIn,
    };

    return this.Ok(ctx, data, true);
  }

  /**
   * @description This method is to get the tutorial status which have been viewed by the user or not
   * @param ctx
   */
  @Route({ path: "/get-tutorial-status", method: HttpMethod.GET })
  @Auth()
  public async getTutorialStatus(ctx: any) {
    try {
      const { user } = ctx.request;
      const userExists = await UserTable.findOne({ _id: user._id });
      if (!userExists) {
        return this.BadRequest(ctx, "User Not Found");
      }
      let data: any = await TutorialStatusTable.findOne({ userId: user._id });
      if (!data) {
        return this.Ok(
          ctx,
          { userId: user._id, ...INITIAL_TUTORIAL_STATUS },
          true
        );
      }
      return this.Ok(ctx, data, true);
    } catch (error) {
      return this.BadRequest(ctx, "Something went wrong");
    }
  }

  /**
   * @description This method is set the viewed tutorial status to true
   * @param ctx
   */
  @Route({ path: "/update-tutorial-status", method: HttpMethod.POST })
  @Auth()
  public async updateTutorialStatus(ctx: any) {
    try {
      const { user, body } = ctx.request;
      const userExists = await UserTable.findOne({ _id: user._id });
      if (!userExists) {
        return this.BadRequest(ctx, "User Not Found");
      }
      if (!Object.keys(TUTORIAL_LOOKUP).includes(body.key)) {
        return this.BadRequest(ctx, "Invalid data");
      }
      await TutorialStatusTable.findOneAndUpdate(
        { userId: user._id },
        { $set: TUTORIAL_LOOKUP[body.key] },
        { upsert: true }
      );
      return this.Ok(ctx, { message: "success" });
    } catch (error) {
      return this.BadRequest(ctx, error.message);
    }
  }
}

export default new UserController();
