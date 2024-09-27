import { PrimeTrustJWT } from "@app/middleware";
import {
  AdminTable,
  UserTable,
  CoachProfileTable,
  LeagueTable,
  BusinessProfileTable,
} from "@app/model";
import {
  TokenService,
  zohoCrmService,
  SocialService,
  DeviceTokenService,
} from "@app/services/v1";
import { AnalyticsService } from "@app/services/v4";
import { HttpMethod } from "@app/types";
import {
  Route,
  makeUniqueReferalCode,
  TIMEZONE_TO_COUNTRY,
} from "@app/utility";
import { ANALYTICS_EVENTS, THINGS_TO_TALK_ABOUT } from "@app/utility/constants";
import BaseController from "@app/controllers/base";
import { validationsV3 } from "@app/validations/v3/apiValidation";
import { UserDBService } from "@app/services/v6";
import {
  BusinessProfileService as BusinessProfileServiceV9,
  UserService as UserServiceV9,
  MilestoneDBService,
} from "@app/services/v9";
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
              await Promise.all([
                UserTable.findOneAndUpdate(
                  { _id: userExists._id },
                  {
                    $set: {
                      "streak.last5days": [null, null, null, null, null],
                      "streak.updatedDate.day": 0,
                      "streak.updatedDate.month": 0,
                      "streak.updatedDate.year": 0,
                    },
                  }
                ),
                BusinessProfileTable.findOneAndUpdate(
                  {
                    userId: userExists._id,
                  },
                  {},
                  { upsert: true }
                ),
              ]);

              accountCreated = true;

              (async () => {
                try {
                  await AnalyticsService.identifyOnce(userExists._id, {
                    Email: userExists.email,
                  });
                  await AnalyticsService.sendEvent(
                    ANALYTICS_EVENTS.SIGNED_UP_SSO,
                    undefined,
                    {
                      device_id: deviceId,
                      user_id: userExists._id,
                      country: TIMEZONE_TO_COUNTRY[reqParam.timezone],
                    }
                  );
                } catch (error) {
                  console.error("Error in analytics flow:", error);
                }
              })();

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

            if (reqParam.savedBusinessIdeas) {
              const updatedUser =
                await BusinessProfileServiceV9.onboardingIdeaUpdate(
                  userExists,
                  reqParam
                );
              (async () => {
                zohoCrmService.addAccounts(
                  ctx.request.zohoAccessToken,
                  updatedUser,
                  true
                );
              })();
            }

            if (reqParam.ideaGenerationType && reqParam.ideaInputValue) {
              AnalyticsService.sendEvent(
                ANALYTICS_EVENTS.AI_TOOL_USED,
                {
                  "Tool name": reqParam.ideaGenerationType,
                  Input: reqParam.ideaInputValue,
                },
                {
                  user_id: userExists._id,
                  country: TIMEZONE_TO_COUNTRY[reqParam.timezone],
                }
              );
            }

            //track analytics events for idea generator in onboarding flow
            const eventsMap = {
              businessGoal: {
                eventType: ANALYTICS_EVENTS.BUSINESS_GOAL_SUBMITTED,
                paramName: "Business Goal",
              },
              technicalExperience: {
                eventType: ANALYTICS_EVENTS.TECHNICAL_EXPERIENCE_SUBMITTED,
                paramName: "Technical Experience",
              },
              moneyInvest: {
                eventType: ANALYTICS_EVENTS.MONEY_INVEST_SUBMITTED,
                paramName: "Invest Money",
              },
            };

            Object.keys(eventsMap).forEach((key) => {
              if (reqParam[key]) {
                AnalyticsService.sendEvent(
                  eventsMap[key].eventType,
                  { [eventsMap[key].paramName]: reqParam[key] },
                  {
                    user_id: userExists._id,
                    country: TIMEZONE_TO_COUNTRY[reqParam.timezone],
                  }
                );
              }
            });

            const { token, refreshToken } = await TokenService.generateToken(
              userExists
            );

            // let { profileData } = await UserDBService.getProfile(
            //   userExists._id
            // );
            const [
              userProfileData,
              businessProfile,
              userAIToolStatus,
              topicDetails,
            ] = await Promise.all([
              UserDBService.getProfile(userExists._id),
              BusinessProfileServiceV9.getBusinessProfile(userExists._id),
              UserServiceV9.userAIToolUsageStatus(userExists),
              ChecklistDBService.getQuizTopics(userExists),
            ]);
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
            let currentLeague = leagues.find(
              (x) =>
                x.minPoint <= userExists.xpPoints &&
                x.maxPoint >= userExists.xpPoints
            );
            const profileData = {
              ...userProfileData,
              businessProfile,
              assignedCoach: coachProfile
                ? {
                    coachProfile,
                    initialMessage,
                    thingsToTalkAbout,
                  }
                : null,
              topicDetails,
              currentLeague,
              userAIToolStatus,
            };

            if (deviceToken) {
              await DeviceTokenService.addDeviceTokenIfNeeded(
                userExists._id,
                deviceToken
              );
            }
            return this.Ok(ctx, {
              token,
              refreshToken,
              profileData: profileData,
              message: "Success",
              accountCreated,
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
