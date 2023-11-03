import { Auth, PrimeTrustJWT } from "@app/middleware";
import { AdminTable, OtpTable, ParentChildTable, UserTable } from "@app/model";
import {
  DeviceTokenService,
  SocialService,
  TokenService,
  zohoCrmService,
} from "@app/services/v1";
import { AnalyticsService } from "@app/services/v4";
import {
  EAUTOAPPROVAL,
  EOTPVERIFICATION,
  EUserType,
  HttpMethod,
} from "@app/types";
import { EPHONEVERIFIEDSTATUS } from "@app/types/user";
import {
  getMinutesBetweenDates,
  makeUniqueReferalCode,
  Route,
  ANALYTICS_EVENTS,
  PARENT_SIGNUP_FUNNEL,
  TEEN_SIGNUP_FUNNEL,
} from "@app/utility";
import { validation } from "@app/validations/v1/apiValidation";
import { validations } from "@app/validations/v2/apiValidation";
import { validationsV3 } from "@app/validations/v3/apiValidation";
import BaseController from "@app/controllers/base";
import UserController from "../v5/user";

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
          const checkMinutes = await getMinutesBetweenDates(
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
            _id: ctx.request.user._id,
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
            let teenExists = await UserTable.findOne({
              mobile: reqParam.mobile,
              isParentFirst: true,
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
              findQuery = { ...findQuery, _id: ctx.request.user._id };
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
          if (migratedId) {
            await UserTable.deleteOne({
              _id: ctx.request.user._id,
            });
          }

          return this.Ok(ctx, {
            message: "Your mobile number is verified successfully",
            migratedId: migratedId ? migratedId : null,
          });
        }
      }
    );
  }

  /**
   * @description This method is used to check valid mobile
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/check-valid-mobile", method: HttpMethod.POST })
  @Auth()
  public async checkValidMobile(ctx) {
    const input = ctx.request.body;
    const user = ctx.request.user;
    return validations.checkValidMobileValidation(
      input,
      ctx,
      async (validate) => {
        if (validate) {
          const { mobile, deviceId } = input;
          AnalyticsService.sendEvent(
            ANALYTICS_EVENTS.PHONE_NUMBER_SUBMITTED,
            undefined,
            {
              device_id: deviceId,
              user_id: user._id,
            }
          );

          let userExists = await UserTable.findOne({
            mobile: mobile,
          });
          return this.Ok(ctx, { message: "Success" });
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
          let parentInUserDraft = await UserTable.findOne({
            _id: ctx.request.user._id,
          });
          if (!parentInUserDraft) {
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
              "The mobile number already belongs to a parent"
            );
          }

          if (
            checkChildMobileAlreadyExists &&
            checkChildMobileAlreadyExists.type == EUserType.TEEN &&
            checkChildMobileAlreadyExists.parentMobile &&
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
              email: parentInUserDraft.email,
              dob: parentInUserDraft.dob,
              type: parentInUserDraft.type,
              mobile: input.mobile,
              firstName: parentInUserDraft.firstName,
              lastName: parentInUserDraft.lastName,
              referralCode: uniqueReferralCode,
              isPhoneVerified: parentInUserDraft.isPhoneVerified,
            };

            if (parentInUserDraft) {
              await UserTable.findOneAndUpdate(
                { _id: parentInUserDraft._id },
                {
                  $set: updateObject,
                },
                {
                  new: true,
                }
              );
            }

            await ParentChildTable.findOneAndUpdate(
              {
                userId: parentInUserDraft._id,
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
            if (parentInUserDraft) {
              await zohoCrmService.searchAccountsAndUpdateDataInCrm(
                ctx.request.zohoAccessToken,
                childMobile ? childMobile : user.mobile,
                parentInUserDraft,
                "false"
              );
            }
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
              userId: parentInUserDraft._id,
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
          return this.Ok(ctx, {
            message: "Invite sent!",
            isAccountFound: false,
          });
        }
      }
    );
  }

  /**
   * @description This api is used for checking parent exists or not in database
   * @returns {*}
   */
  @Route({ path: "/check-parent-exists", method: HttpMethod.POST })
  @Auth()
  @PrimeTrustJWT(true)
  public async checkParentExists(ctx: any) {
    if (!ctx.request.body.mobile) {
      return this.BadRequest(ctx, "Please enter your mobile");
    }
    if (ctx.request.body.mobile === ctx.request.body.parentMobile) {
      return this.BadRequest(
        ctx,
        "Your mobile number and parent's mobile number cannot be same"
      );
    }
    let checkParentExists = await UserTable.findOne({
      mobile: ctx.request.body.parentMobile,
    });

    if (checkParentExists && checkParentExists.type !== EUserType.PARENT) {
      const msg = checkParentExists.type === EUserType.SELF ? "self" : "child";
      return this.BadRequest(
        ctx,
        `Looks like this phone number is associated with a ${msg} account. Please try a different phone number`
      );
    }
    await UserTable.findOneAndUpdate(
      { _id: ctx.request.user._id },
      {
        $set: {
          parentEmail: checkParentExists?.email || null,
          parentMobile: ctx.request.body.parentMobile,
          isEnteredParentNumber: true,
        },
      }
    );
    /**
     * check if parent exists then parent have firstChild, then link secondTeen to parent
     * Else only update the mobile number of parent to that teen
     */
    if (checkParentExists) {
      const parentChild: any = await ParentChildTable.findOne({
        userId: checkParentExists._id,
      });
      if (parentChild) {
        const checkteenExists = parentChild.teens.find(
          (x) => x.childId.toString() === ctx.request.user._id.toString()
        );
        if (!checkteenExists && parentChild.teens.length >= 1) {
          const abc = await ParentChildTable.findOneAndUpdate(
            { userId: checkParentExists._id },
            {
              $push: {
                teens: {
                  childId: ctx.request.user._id,
                  accountId: null,
                  accountNumber: null,
                  pushTransferId: null,
                },
              },
            }
          );
        }
      }
    }

    return this.Ok(
      ctx,
      !checkParentExists
        ? { message: "User Not Found", isAccountFound: false }
        : { message: "Success", isAccountFound: true }
    );
  }

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
            let userExists = await UserTable.findOne({ email });
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
              };
              userExists = await UserTable.create(createQuery);

              accountCreated = true;

              // for sensitive identify calls,we need to await to make sure it waits.
              await AnalyticsService.identifyOnce(userExists._id, {
                // "Account Type": EUserType[reqParam.type],
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

              if (userExists) {
                /**
                 * Zoho crm account addition
                 */
                let dataSentInCrm: any = {
                  Account_Name: reqParam.firstName + " " + reqParam.lastName,
                  First_Name: reqParam.firstName,
                  Last_Name: reqParam.lastName ? reqParam.lastName : null,
                  Email: reqParam.email,
                };

                await zohoCrmService.addAccounts(
                  ctx.request.zohoAccessToken,
                  dataSentInCrm
                );
              } else {
                return this.BadRequest(ctx, "User Not Found");
              }
            }

            const { token, refreshToken } = await TokenService.generateToken(
              userExists
            );

            let getProfileInput: any = {
              request: {
                query: { token },
                params: {
                  id: userExists._id,
                },
              },
            };
            await UserController.getProfile(getProfileInput);

            if (deviceToken) {
              await DeviceTokenService.addDeviceTokenIfNeeded(
                userExists._id,
                deviceToken
              );
            }
            return this.Ok(ctx, {
              token,
              refreshToken,
              profileData: getProfileInput.body.data,
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
