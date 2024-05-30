import { PrimeTrustJWT } from "@app/middleware";
import {
  AdminTable,
  UserTable,
  CoachProfileTable,
  LeagueTable,
} from "@app/model";
import {
  TokenService,
  zohoCrmService,
  SocialService,
  DeviceTokenService,
} from "@app/services/v1";
import { AnalyticsService } from "@app/services/v4";
import { HttpMethod } from "@app/types";
import { Route, makeUniqueReferalCode } from "@app/utility";
import { ANALYTICS_EVENTS, THINGS_TO_TALK_ABOUT } from "@app/utility/constants";
import BaseController from "@app/controllers/base";
import { validationsV3 } from "@app/validations/v3/apiValidation";
import { UserDBService } from "@app/services/v6";
import { BusinessProfileService as BusinessProfileServiceV7 } from "@app/services/v7";
import { ChecklistDBService } from "@app/services/v9";

class AuthController extends BaseController {
  /**
   * @description This method will be used to verify social id token and email in case of user registration and if email not verified create a user
   */
  @Route({ path: "/check-user-signup", method: HttpMethod.POST })
  @PrimeTrustJWT(true)
  public async checkSignUp(ctx: any) {
    const reqParam = ctx.request.body;
    return validationsV3.checkUserSignupValidation(
      reqParam,
      ctx,
      async (validate: boolean) => {
        if (validate) {
          try {
            const { email, deviceToken, deviceId } = reqParam;
            let accountCreated = false;
            let coachProfile = null;
            let initialMessage = null;
            let thingsToTalkAbout = null;
            let [userExists, adminDetails, leagues] = await Promise.all([
              UserTable.findOne({ email }),
              AdminTable.findOne({}),
              LeagueTable.find(
                {},
                {
                  _id: 0,
                  name: 1,
                  image: 1,
                  colorCode: 1,
                  minPoint: 1,
                  maxPoint: 1,
                }
              ),
            ]);
            await SocialService.verifySocial(reqParam);

            if (!userExists) {
              const uniqueReferralCode = await makeUniqueReferalCode();
              const createQuery: any = {
                email: reqParam.email,
                firstName: reqParam.firstName ? reqParam.firstName : null,
                lastName: reqParam.lastName ? reqParam.lastName : null,
                dob: reqParam.dob,
                type: reqParam.type,
                referralCode: uniqueReferralCode,
                preLoadedCoins: adminDetails.stackCoins,
              };
              userExists = await UserTable.create(createQuery);
              // To handle inaccurate streak counts for users who signup again after deleting their accounts
              await UserTable.findOneAndUpdate(
                { _id: userExists._id },
                {
                  $set: {
                    "streak.last5days": [null, null, null, null, null],
                    "streak.updatedDate.day": 0,
                    "streak.updatedDate.month": 0,
                    "streak.updatedDate.year": 0,
                  },
                }
              );

              accountCreated = true;

              // for sensitive identify calls, we need to await to make sure it waits.
              AnalyticsService.identifyOnce(userExists._id, {
                Email: userExists.email,
              });

              AnalyticsService.sendEvent(
                ANALYTICS_EVENTS.SIGNED_UP_SSO,
                undefined,
                {
                  device_id: deviceId,
                  user_id: userExists._id,
                }
              );

              let dataSentInCrm: any = {
                Account_Name: reqParam.firstName + " " + reqParam.lastName,
                First_Name: reqParam.firstName,
                Last_Name: reqParam.lastName ? reqParam.lastName : null,
                Email: reqParam.email,
                User_ID: userExists._id,
              };

              await zohoCrmService.addAccounts(
                ctx.request.zohoAccessToken,
                dataSentInCrm
              );
            } else {
              let dataSentInCrm: any = {
                Email: reqParam.email,
                User_ID: userExists._id,
              };

              zohoCrmService.addAccounts(
                ctx.request.zohoAccessToken,
                dataSentInCrm
              );
            }

            const { token, refreshToken } = await TokenService.generateToken(
              userExists
            );

            let { data: profileData } = await UserDBService.getProfile(
              userExists._id
            );
            const businessProfile =
              await BusinessProfileServiceV7.getBusinessProfile(userExists._id);
            if (
              businessProfile &&
              businessProfile?.businessCoachInfo?.coachId
            ) {
              coachProfile = await CoachProfileTable.findOne({
                _id: businessProfile.businessCoachInfo.coachId,
              });
              initialMessage = businessProfile.businessCoachInfo.initialMessage;
              thingsToTalkAbout = THINGS_TO_TALK_ABOUT;
            }
            profileData = {
              ...profileData,
              businessProfile,
              assignedCoach: coachProfile
                ? {
                    coachProfile,
                    initialMessage,
                    thingsToTalkAbout,
                  }
                : null,
            };

            if (deviceToken) {
              await DeviceTokenService.addDeviceTokenIfNeeded(
                userExists._id,
                deviceToken
              );
            }
            const topicDetails = await ChecklistDBService.getQuizTopics(
              userExists
            );
            let currentLeague = leagues.find(
              (x) =>
                x.minPoint <= userExists.xpPoints &&
                x.maxPoint >= userExists.xpPoints
            );
            return this.Ok(ctx, {
              token,
              refreshToken,
              profileData: profileData,
              message: "Success",
              accountCreated,
              topicDetails,
              currentLeague,
            });
          } catch (error) {
            return this.BadRequest(ctx, error.message);
          }
        }
      }
    );
  }
}

export default new AuthController();
