import { EPHONEVERIFIEDSTATUS } from "../../types/user";
import { ANALYTICS_EVENTS, TEEN_SIGNUP_FUNNEL } from "../../utility/constants";
import { Auth, PrimeTrustJWT } from "../../middleware";
import { AdminTable, OtpTable, UserTable } from "../../model";
import {
  zohoCrmService,
  TokenService,
  AnalyticsService,
} from "../../services/v1";
import { EOTPVERIFICATION, EUserType, HttpMethod } from "../../types";
import { getMinutesBetweenDates, Route } from "../../utility";
import { PARENT_SIGNUP_FUNNEL } from "../../utility/constants";
import { validation } from "../../validations/v1/apiValidation";
import { validationsV4 } from "../../validations/v4/apiValidation";
import BaseController from "../base";

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
          let teenExists = await UserTable.findOne({
            mobile: reqParam.mobile,
            isParentFirst: true,
          });
          if (isOtpVerified) {
            AnalyticsService.sendEvent(ANALYTICS_EVENTS.PHONE_NUMBER_VERIFIED, {
              user_id: user._id,
            });

            let findQuery = {};
            let setQuery = {};
            if (teenExists) {
              findQuery = { ...findQuery, _id: teenExists._id };
              setQuery = {
                ...setQuery,
                isPhoneVerified: EPHONEVERIFIEDSTATUS.TRUE,
                email: userExists.email,
                dob: userExists.dob,
              };
              migratedId = teenExists._id;
            } else {
              findQuery = { ...findQuery, _id: user._id };
              setQuery = {
                ...setQuery,
                mobile: reqParam.mobile,
                isPhoneVerified: EPHONEVERIFIEDSTATUS.TRUE,
              };
            }
            updateUser = await UserTable.findOneAndUpdate(
              findQuery,
              {
                $set: setQuery,
              },
              { new: true }
            );

            const isUserNotTeen =
              updateUser.type == EUserType.PARENT ||
              updateUser.type == EUserType.SELF;

            const parentSignupFunnel = [
              ...PARENT_SIGNUP_FUNNEL.SIGNUP,
              PARENT_SIGNUP_FUNNEL.DOB,
              PARENT_SIGNUP_FUNNEL.MOBILE_NUMBER,
            ];

            const teenSignupFunnel = [
              TEEN_SIGNUP_FUNNEL.SIGNUP,
              TEEN_SIGNUP_FUNNEL.DOB,
              TEEN_SIGNUP_FUNNEL.PHONE_NUMBER,
            ];

            let dataSentInCrm: any = {
              Account_Name: updateUser.firstName + " " + updateUser.lastName,
              Email: updateUser.email,
              Mobile: reqParam.mobile,
              ...(isUserNotTeen && {
                Parent_Signup_Funnel: parentSignupFunnel,
              }),
              ...(!isUserNotTeen && { Teen_Signup_Funnel: teenSignupFunnel }),
            };

            await zohoCrmService.addAccounts(
              ctx.request.zohoAccessToken,
              dataSentInCrm
            );
          }
          let response: any = {
            message: "Your mobile number is verified successfully",
          };
          if (migratedId) {
            await UserTable.deleteOne({
              _id: user._id,
            });
            /**
             * Give new auth token instead of migratedId which will be used for other apis.
             */
            const { token, refreshToken } = await TokenService.generateToken(
              teenExists
            );
            console.log(token, "token");
            response = { ...response, token, refreshToken };
          }

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
  public verifyOtp(ctx: any) {
    const reqParam = ctx.request.body;
    const user = ctx.request.user;
    return validationsV4.verifyOtpValidation(
      reqParam,
      ctx,
      async (validate: boolean) => {
        if (validate) {
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
          if (otpExists.code != reqParam.code) {
            return this.BadRequest(ctx, "Code Doesn't Match");
          }
          /**
           * All conditions valid
           */
          await UserTable.updateOne(
            { _id: user._id },
            {
              $set: {
                mobile: reqParam.mobile,
                isPhoneVerified: EPHONEVERIFIEDSTATUS.TRUE,
              },
            }
          );
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
}

export default new AuthController();
