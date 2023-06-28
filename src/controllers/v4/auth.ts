import { Auth, PrimeTrustJWT } from "@app/middleware";
import {
  AdminTable,
  OtpTable,
  UserTable,
  ParentChildTable,
  UserReferralTable,
} from "@app/model";
import { TokenService, zohoCrmService, userService } from "@app/services/v1";
import { AnalyticsService } from "@app/services/v4";
import {
  EOTPVERIFICATION,
  EUserType,
  HttpMethod,
  EAUTOAPPROVAL,
} from "@app/types";
import { EPHONEVERIFIEDSTATUS } from "@app/types/user";
import {
  getMinutesBetweenDates,
  Route,
  makeUniqueReferalCode,
} from "@app/utility";
import {
  ANALYTICS_EVENTS,
  PARENT_SIGNUP_FUNNEL,
  TEEN_SIGNUP_FUNNEL,
} from "@app/utility/constants";
import { validation } from "@app/validations/v1/apiValidation";
import { validationsV4 } from "@app/validations/v4/apiValidation";
import BaseController from "@app/controllers/base";

class AuthController extends BaseController {
  /**
   * @description This method is used to verify otp during sign up.
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/verify-otp-signup", method: HttpMethod.POST })
  @Auth()
  @PrimeTrustJWT(true)
  public verifyOtpSignUp(ctx: any) {
    const reqParam = ctx.request.body;
    const user = ctx.request.user;
    return validation.verifyOtpValidation(
      reqParam,
      ctx,
      async (validate: boolean) => {
        if (validate) {
          let migratedId;
          const admin = await AdminTable.findOne({});
          const otpExists = await OtpTable.findOne({
            receiverMobile: reqParam.mobile,
          }).sort({ createdAt: -1 });
          if (!otpExists) {
            return this.BadRequest(ctx, "Mobile Number Not Found");
          }
          if (otpExists.isVerified === EOTPVERIFICATION.VERIFIED) {
            return this.BadRequest(ctx, "Mobile Number Already Verified");
          }
          /**
           * Check minutes less than 5 or not
           */
          const checkMinutes = getMinutesBetweenDates(
            new Date(otpExists.createdAt),
            new Date()
          );
          if (checkMinutes > 5) {
            return this.BadRequest(ctx, {
              error_code: "code_expired",
              message:
                "Otp Time Limit Expired. Please resend otp and try to submit it within 5 minutes.",
            });
          }
          /* tslint:disable-next-line */
          if (otpExists.code != reqParam.code) {
            return this.BadRequest(ctx, "Code Doesn't Match");
          }
          let userExists = await UserTable.findOne({
            _id: user._id,
          });
          if (!userExists) {
            return this.BadRequest(ctx, "User Not Found");
          }
          const isOtpVerified = await OtpTable.updateOne(
            { _id: otpExists._id },
            { $set: { isVerified: EOTPVERIFICATION.VERIFIED } }
          );
          let updateUser = null;
          if (isOtpVerified) {
            AnalyticsService.sendEvent(
              ANALYTICS_EVENTS.PHONE_NUMBER_VERIFIED,
              undefined,
              {
                device_id: reqParam.deviceId,
                user_id: user._id,
              }
            );

            let findQuery = {};
            let setQuery = {};
            if (userExists) {
              findQuery = { ...findQuery, _id: userExists._id };
              setQuery = {
                ...setQuery,
                isPhoneVerified: EPHONEVERIFIEDSTATUS.TRUE,
                email: userExists.email,
                mobile: reqParam.mobile,
              };
            }
            updateUser = await UserTable.findOneAndUpdate(
              findQuery,
              {
                $set: setQuery,
              },
              { new: true }
            );

            let dataSentInCrm: any = {
              Account_Name: updateUser.firstName + " " + updateUser.lastName,
              Email: updateUser.email,
              Mobile: reqParam.mobile,
            };

            await zohoCrmService.addAccounts(
              ctx.request.zohoAccessToken,
              dataSentInCrm
            );
          }
          let response: any = {
            message: "Your mobile number is verified successfully",
          };

          return this.Ok(ctx, response);
        }
      }
    );
  }

  /**
   * @description This method is used to verify otp.
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/verify-otp", method: HttpMethod.POST })
  @Auth()
  public async verifyOtp(ctx: any) {
    const { body, user } = ctx.request;
    const userIfExists = await UserTable.findOne({ _id: user._id });
    if (!userIfExists) {
      return this.BadRequest(ctx, "User not found");
    }
    return validationsV4.verifyOtpValidation(
      body,
      ctx,
      async (validate: boolean) => {
        if (validate) {
          const otpExists = await OtpTable.findOne({
            receiverMobile: body.mobile,
          }).sort({ createdAt: -1 });
          if (!otpExists) {
            return this.BadRequest(ctx, "Mobile Number Not Found");
          }
          if (otpExists.isVerified === EOTPVERIFICATION.VERIFIED) {
            return this.BadRequest(ctx, "Mobile Number Already Verified");
          }
          /**
           * Check minutes less than 5 or not
           */
          const checkMinutes = await getMinutesBetweenDates(
            new Date(otpExists.createdAt),
            new Date()
          );
          if (checkMinutes > 5) {
            return this.BadRequest(
              ctx,
              "Otp Time Limit Expired. Please resend otp and try to submit it within 5 minutes."
            );
          }
          /* tslint:disable-next-line */
          if (otpExists.code != body.code) {
            return this.BadRequest(ctx, "Code Doesn't Match");
          }
          /**
           * All conditions valid
           */
          await UserTable.updateOne(
            { _id: user._id },
            {
              $set: {
                mobile: body.mobile,
                isPhoneVerified: EPHONEVERIFIEDSTATUS.TRUE,
              },
            }
          );
          if (userIfExists.type == EUserType.PARENT) {
            await UserTable.updateMany(
              { parentMobile: userIfExists.mobile },
              {
                $set: { parentMobile: body.mobile },
              }
            );
          }
          await OtpTable.updateOne(
            { _id: otpExists._id },
            { $set: { isVerified: EOTPVERIFICATION.VERIFIED } }
          );
          return this.Ok(ctx, {
            message: "Your mobile number is changed successfully",
          });
        }
      }
    );
  }

  /**
   * @description This method is used to check whether parent and child exists.
   * @param ctx
   * @returns
   */
  @Route({ path: "/check-account-ready-to-link", method: HttpMethod.POST })
  @Auth()
  @PrimeTrustJWT(true)
  public async checkAccountReadyToLink(ctx: any) {
    const input = ctx.request.body;
    return validation.checkAccountReadyToLinkValidation(
      input,
      ctx,
      async (validate) => {
        if (validate) {
          const { mobile, childMobile, email, childFirstName, childLastName } =
            input;
          let query: any = { mobile: childMobile };

          let parentIfExists = await UserTable.findOne({
            _id: ctx.request.user._id,
          });
          if (!parentIfExists) {
            return this.BadRequest(ctx, "User not found");
          }

          let childIfExists = await UserTable.findOne({ mobile: childMobile });
          if (childIfExists && childIfExists.type != EUserType.TEEN) {
            return this.BadRequest(
              ctx,
              "The mobile number already belongs to a parent"
            );
          }
          if (
            childIfExists?.type == EUserType.TEEN &&
            childIfExists.parentMobile &&
            childIfExists.parentMobile !== mobile
          ) {
            return this.BadRequest(
              ctx,
              "The mobile is already linked to another parent"
            );
          }

          /**
           * migrate parent from userdraft to user table
           */
          const uniqueReferralCode = await makeUniqueReferalCode();

          let user = await UserTable.findOne(query);

          const baseChildUser = {
            firstName: childFirstName || user.firstName,
            lastName: childLastName || user.lastName,
            mobile: childMobile || user.mobile,
            parentEmail: email,
            parentMobile: mobile,
            type: EUserType.TEEN,
            isParentFirst: false,
            isAutoApproval: EAUTOAPPROVAL.ON,
          };

          if (user) {
            await UserTable.findByIdAndUpdate(
              {
                _id: user._id,
              },
              {
                $set: baseChildUser,
              },
              { new: true }
            );

            await UserTable.findOneAndUpdate(
              { _id: parentIfExists._id },
              {
                $set: {
                  email: parentIfExists.email,
                  dob: parentIfExists.dob,
                  type: parentIfExists.type,
                  mobile: input.mobile,
                  firstName: parentIfExists.firstName,
                  lastName: parentIfExists.lastName,
                  referralCode: uniqueReferralCode,
                  isPhoneVerified: parentIfExists.isPhoneVerified,
                },
              },
              {
                new: true,
              }
            );

            await ParentChildTable.findOneAndUpdate(
              {
                userId: parentIfExists._id,
              },
              {
                $set: {
                  contactId: null,
                  firstChildId: user._id,
                  teens: [{ childId: user._id, accountId: null }],
                },
              },
              { upsert: true, new: true }
            );

            /**
             * Add zoho crm
             */
            await zohoCrmService.searchAccountsAndUpdateDataInCrm(
              ctx.request.zohoAccessToken,
              childMobile ? childMobile : user.mobile,
              parentIfExists,
              "false"
            );

            await AnalyticsService.identifyOnce(parentIfExists._id, {
              "Teen First": true,
            });

            AnalyticsService.sendEvent(
              ANALYTICS_EVENTS.PARENT_SIGNED_UP,
              undefined,
              {
                user_id: user._id,
              }
            );

            return this.Ok(ctx, {
              message: "Account successfully linked!",
              isAccountFound: true,
            });
          }

          let checkMobileExists = await UserTable.findOne({
            mobile: childMobile,
          });
          if (checkMobileExists) {
            return this.BadRequest(ctx, "Child Mobile Already Exists");
          }
          if (!childFirstName) {
            return this.Ok(ctx, {
              message: "You are inviting your teen in Jetson",
            });
          }
          /**
           * Generate referal code when user sign's up.
           */
          const createTeenObject = {
            ...baseChildUser,
            referralCode: uniqueReferralCode,
            isParentFirst: true,
          };
          let createChild = await UserTable.create(createTeenObject);

          await ParentChildTable.findOneAndUpdate(
            {
              userId: parentIfExists._id,
            },
            {
              $set: {
                contactId: null,
                firstChildId: createChild._id,
                teens: [{ childId: createChild._id, accountId: null }],
              },
            },
            { upsert: true, new: true }
          );
          let preTreenAccountExists = await UserTable.find({
            _id: { $ne: createChild._id },
            parentMobile: mobile,
            isParentFirst: true,
          });
          if (preTreenAccountExists.length > 0) {
            await UserTable.deleteMany({
              _id: { $ne: createChild._id },
              parentMobile: mobile,
              isParentFirst: true,
            });
          }

          AnalyticsService.identifyOnce(parentIfExists._id, {
            "Teen First": false,
          });

          return this.Ok(ctx, {
            message: "Invite sent!",
            isAccountFound: false,
          });
        }
      }
    );
  }

  /**
   * @description This method is used to check referral and if exists it give both teens 20xp
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/check-referral", method: HttpMethod.POST })
  @Auth()
  public async checkForReferral(ctx: any) {
    try {
      const { user, body } = ctx.request;
      const userExists = await UserTable.findOne({ _id: user._id });
      if (!userExists) {
        return this.BadRequest(ctx, "User not found");
      }
      if (!body.referralCode) {
        return this.Ok(ctx, { message: "No XP Points rewarded" });
      }
      let alreadyReferredUser = await UserReferralTable.findOne({
        "referralArray.referredId": userExists._id,
      });
      if (alreadyReferredUser) {
        return this.Ok(ctx, { message: "Already Referred User" });
      }
      let checkUserReferralExists = await UserTable.findOne({
        _id: { $ne: userExists._id },
        referralCode: body.referralCode,
        type: EUserType.TEEN,
      });
      if (!checkUserReferralExists) {
        return this.Ok(ctx, { message: "No XP Points rewarded" });
      }
      /**
       * add referral code number as well
       */
      let senderName = checkUserReferralExists.lastName
        ? checkUserReferralExists.firstName +
          " " +
          checkUserReferralExists.lastName
        : checkUserReferralExists.firstName;

      let receiverName = userExists.lastName
        ? userExists.firstName + " " + userExists.lastName
        : userExists.firstName;
      await userService.updateOrCreateUserReferral(
        checkUserReferralExists._id,
        userExists._id,
        senderName,
        receiverName
      );
      await userService.redeemUserReferral(
        checkUserReferralExists._id,
        [userExists._id],
        body.referralCode
      );
      return this.Ok(ctx, { message: "Successfully rewarded XP Points" });
    } catch (error) {
      return this.BadRequest(ctx, "Something went wrong");
    }
  }
}

export default new AuthController();
