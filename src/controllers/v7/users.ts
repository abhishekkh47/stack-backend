import BaseController from "@app/controllers/base";
import { Auth, PrimeTrustJWT, RevenueCatAuth } from "@app/middleware";
import { UserDBService } from "@app/services/v6";
import { HttpMethod } from "@app/types";
import { Route, THINGS_TO_TALK_ABOUT } from "@app/utility";
import { BusinessProfileService } from "@app/services/v7";
import { CoachProfileTable, UserTable } from "@app/model";
import { zohoCrmService } from "@app/services/v1";

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
    const [userProfile, businessProfile] = await Promise.all([
      UserDBService.getProfile(id),
      BusinessProfileService.getBusinessProfile(id),
    ]);
    if (businessProfile && businessProfile?.businessCoachInfo?.coachId) {
      coachProfile = await CoachProfileTable.findOne({
        _id: businessProfile.businessCoachInfo.coachId,
      });
      initialMessage = businessProfile.businessCoachInfo.initialMessage;
    }

    let data = {
      ...userProfile.data,
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

  /**
   * @description This method is used update whether a user is premium user or not
   * @param ctx
   */
  @Route({ path: "/pro-user-status", method: HttpMethod.POST })
  @Auth()
  @PrimeTrustJWT(true)
  public async UpdateProUserStatus(ctx: any) {
    const { user, body } = ctx.request;
    const userIfExists = await UserTable.findOneAndUpdate(
      { _id: user._id },
      { $set: { isPremiumUser: body.isPremiumUser } },
      { upsert: true, new: true }
    );
    if (!userIfExists) {
      return this.BadRequest(ctx, "User Not Found");
    }
    return this.Ok(ctx, { message: "Success" });
  }

  /**
   * @description This method is called via a webhook from revenuecat, when a user do any transaction
   * @param ctx
   */
  @Route({ path: "/update-subscription-details", method: HttpMethod.POST })
  @RevenueCatAuth()
  public async checkProStatus(ctx: any) {
    try {
      const { event } = ctx.request.body;
      const userIfExists = await UserTable.findOne({ _id: event.app_user_id });
      if (userIfExists) {
        let proPlanStatus = "Active";
        let isPremiumUser = "true";
        if (
          event.type == "EXPIRATION" ||
          event.type == "CANCELLATION" ||
          event.type == "UNSUBSCRIBE" ||
          event.type == "SUBSCRIPTION_PAUSED"
        ) {
          proPlanStatus = "Inactive";
          isPremiumUser = "false";
        }
        await UserTable.findOneAndUpdate(
          { _id: userIfExists._id },
          { $set: { isPremiumUser } },
          { upsert: true, new: true }
        );
        let dataSentInCrm = [
          {
            Account_Name: userIfExists.firstName + " " + userIfExists.lastName,
            Email: userIfExists.email,
            Pro_Plan: event.product_id || null,
            Pro_Plan_Status: proPlanStatus,
          },
        ];
        zohoCrmService.addAccounts(
          ctx.request.zohoAccessToken,
          dataSentInCrm,
          true
        );
      }
      return this.Ok(ctx, { message: "Success" });
    } catch (error) {
      return this.BadRequest(ctx, {
        message: `Error while update subscription details - ${error.message}`,
      });
    }
  }
}

export default new UserController();
