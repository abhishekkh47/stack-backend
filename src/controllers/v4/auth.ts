import { EPHONEVERIFIEDSTATUS } from "../../types/user";
import { ANALYTICS_EVENTS, TEEN_SIGNUP_FUNNEL } from "../../utility/constants";
import { Auth, PrimeTrustJWT } from "../../middleware";
import { AdminTable, OtpTable, UserTable, ParentChildTable } from "../../model";
import {
  zohoCrmService,
  TokenService,
} from "../../services/v1";
import { AnalyticsService } from "../../services/v4";
import { EOTPVERIFICATION, EUserType, HttpMethod, EAUTOAPPROVAL } from "../../types";
import { getMinutesBetweenDates, Route, makeUniqueReferalCode } from "../../utility";
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
            AnalyticsService.sendEvent(ANALYTICS_EVENTS.PHONE_NUMBER_VERIFIED, undefined, {
              device_id: reqParam.deviceId,
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
          const {
            mobile,
            childMobile,
            email,
            childEmail,
            childFirstName,
            childLastName,
          } = input;
          let query: any = {
            mobile: childMobile,
          };
          let parentIfExists = await UserTable.findOne({
            _id: ctx.request.user._id,
          });
          if (!parentIfExists) {
            return this.BadRequest(ctx, "User not found");
          }

          let checkChildMobileAlreadyExists = await UserTable.findOne({
            mobile: childMobile,
          });

          if (
            checkChildMobileAlreadyExists &&
            checkChildMobileAlreadyExists.type != EUserType.TEEN
          ) {
            return this.BadRequest(
              ctx,
              "The mobile no. already belongs to a parent"
            );
          }

          if (
            checkChildMobileAlreadyExists &&
            checkChildMobileAlreadyExists.type == EUserType.TEEN &&
            checkChildMobileAlreadyExists &&
            checkChildMobileAlreadyExists.parentMobile !== mobile
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
          if (childEmail) {
            query = {
              ...query,
              email: { $regex: `${childEmail}$`, $options: "i" },
            };
          }

          let user = await UserTable.findOne(query);

          const baseChildUser = {
            firstName: childFirstName ? childFirstName : user.firstName,
            lastName: childLastName ? childLastName : user.lastName,
            mobile: childMobile ? childMobile : user.mobile,
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

            const updateObject = {
              email: parentIfExists.email,
              dob: parentIfExists.dob,
              type: parentIfExists.type,
              mobile: input.mobile,
              firstName: parentIfExists.firstName,
              lastName: parentIfExists.lastName,
              referralCode: uniqueReferralCode,
              isPhoneVerified: parentIfExists.isPhoneVerified,
            };

            await UserTable.findOneAndUpdate(
              { _id: parentIfExists._id },
              {
                $set: updateObject,
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

            AnalyticsService.identifyOnce(parentIfExists._id, 'Teen First', true);

            return this.Ok(ctx, {
              message: "Account successfully linked!",
              isAccountFound: true,
            });
          }
          /**
           * This validation is there to keep if any child sign up with parent email or mobile
           */
          if (childEmail) {
            let checkEmailExists = await UserTable.findOne({
              email: childEmail,
            });
            if (checkEmailExists) {
              return this.BadRequest(ctx, "Child Email Already Exists");
            }
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
            email: childEmail,
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

          AnalyticsService.identifyOnce(parentIfExists._id, 'Teen First', false);

          return this.Ok(ctx, {
            message: "Invite sent!",
            isAccountFound: false,
          });
        }
      }
    );
  }  
}

export default new AuthController();
