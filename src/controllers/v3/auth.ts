import { validations } from "../../validations/v2/apiValidation";
import { validationsV3 } from "../../validations/v3/apiValidation";
import { EPHONEVERIFIEDSTATUS } from "../../types/user";
import { TEEN_SIGNUP_FUNNEL } from "../../utility/constants";
import { Auth, PrimeTrustJWT } from "../../middleware";
import {
  AdminTable,
  CryptoTable,
  OtpTable,
  ParentChildTable,
  TransactionTable,
  UserTable,
} from "../../model";
import {
  DeviceTokenService,
  SocialService,
  TokenService,
  zohoCrmService,
} from "../../services/v1/index";
import {
  EAUTOAPPROVAL,
  EOTPVERIFICATION,
  EUserType,
  HttpMethod,
} from "../../types";
import {
  getMinutesBetweenDates,
  getRefreshToken,
  internalAssetTransfers,
  makeUniqueReferalCode,
  Route,
} from "../../utility";
import { PARENT_SIGNUP_FUNNEL } from "../../utility/constants";
import { validation } from "../../validations/v1/apiValidation";
import BaseController from "../base";
import UserController from "../v3/user";
import { UserDBService, TransactionDBService } from "../../services/v2";

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
            return this.BadRequest(
              ctx,
              "Otp Time Limit Expired. Please resend otp and try to submit it within 5 minutes."
            );
          }
          /* tslint:disable-next-line */
          if (otpExists.code != reqParam.code) {
            return this.BadRequest(ctx, "Code Doesn't Match");
          }
          const optVerfidied = await OtpTable.updateOne(
            { _id: otpExists._id },
            { $set: { isVerified: EOTPVERIFICATION.VERIFIED } }
          );
          if (optVerfidied) {
            let updateUser = await UserTable.findByIdAndUpdate(
              {
                _id: ctx.request.user._id,
              },
              {
                $set: {
                  mobile: reqParam.mobile,
                  isPhoneVerified: EPHONEVERIFIEDSTATUS.TRUE,
                },
              },
              { new: true }
            );

            if (updateUser.type == EUserType.SELF) {
              const crypto = await CryptoTable.findOne({ symbol: "BTC" });

              const newUserDetail = await UserDBService.createUserAccount(
                updateUser,
                reqParam.mobile
              );

              migratedId = newUserDetail._id;

              let checkTransactionExists = await TransactionTable.findOne({
                userId: newUserDetail._id,
              });
              if (
                admin.giftCryptoSetting == 1 &&
                newUserDetail.isGiftedCrypto == 0 &&
                !checkTransactionExists
              ) {
                await TransactionDBService.createBtcGiftedTransaction(
                  newUserDetail._id,
                  crypto,
                  admin
                );
              }
            }

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
    return validations.checkValidMobileValidation(
      input,
      ctx,
      async (validate) => {
        if (validate) {
          const { mobile, type } = input;
          let userExists = await UserTable.findOne({
            mobile: mobile,
          });
          if (userExists && type == EUserType.TEEN) {
            if (userExists.isParentFirst == true) {
              return this.Ok(ctx, { message: "Success" });
            }
          }
          if (userExists) {
            return this.BadRequest(ctx, "Mobile Number Already Exists");
          }
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
            mobile: childMobile
          })

          if(checkChildMobileAlreadyExists && checkChildMobileAlreadyExists.type != EUserType.TEEN) {
            return this.BadRequest(ctx, "The mobile no. already belongs to a parent");
          }

          if(checkChildMobileAlreadyExists && checkChildMobileAlreadyExists.type == EUserType.TEEN && checkChildMobileAlreadyExists.parentMobile !== mobile) {
            return this.BadRequest(ctx, "The mobile is already linked to another parent");
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
              message: "You are inviting your teen in stack",
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

          /**
           * Add zoho crm
           */
          if (parentInUserDraft) {
            await zohoCrmService.searchAccountsAndUpdateDataInCrm(
              ctx.request.zohoAccessToken,
              childMobile ? childMobile : user.mobile,
              parentInUserDraft,
              "true"
            );
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
          parentMobile: ctx.request.body.parentMobile,
        },
      }
    );

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
    console.log('reqParam: ', reqParam);
    return validationsV3.checkUserSignupValidation(
      reqParam,
      ctx,
      async (validate: boolean) => {
        if (validate) {
          try {
            const { email, deviceToken } = reqParam;
            let accountCreated = false;
            let userExists = await UserTable.findOne({ email });
            await SocialService.verifySocial(reqParam);
            if (!userExists) {
              if (!reqParam.type) {
                return this.BadRequest(ctx, "Please enter user type");
              }
              if (!reqParam.dob) {
                return this.BadRequest(ctx, "Please enter dob");
              }
              if (reqParam.type === EUserType.SELF) {
                return this.BadRequest(
                  ctx,
                  "Hang tight -- we aren't currently serving users of your age."
                );
              }
              const isUserBelow18 =
                new Date(
                  Date.now() - new Date(reqParam.dob).getTime()
                ).getFullYear() < 1988;
              if (
                (isUserBelow18 && reqParam.type == EUserType.PARENT) ||
                (!isUserBelow18 && reqParam.type == EUserType.TEEN)
              ) {
                return this.BadRequest(
                  ctx,
                  "Dob doesn't match with your type."
                );
              }
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
              if (userExists) {
                /**
                 * Zoho crm account addition
                 */
                let dataSentInCrm: any = {
                  Account_Name: reqParam.firstName + " " + reqParam.lastName,
                  First_Name: reqParam.firstName,
                  Last_Name: reqParam.lastName ? reqParam.lastName : null,
                  Email: reqParam.email,
                  Birthday: reqParam.dob,
                  Account_Type:
                    reqParam.type == EUserType.PARENT ? "Parent" : "Self",
                };
                if (isUserBelow18) {
                  dataSentInCrm = {
                    ...dataSentInCrm,
                    Teen_Signup_Funnel: [
                      TEEN_SIGNUP_FUNNEL.SIGNUP,
                      TEEN_SIGNUP_FUNNEL.DOB,
                    ],
                  };
                } else {
                  dataSentInCrm = {
                    ...dataSentInCrm,
                    Parent_Signup_Funnel: [
                      ...PARENT_SIGNUP_FUNNEL.SIGNUP,
                      PARENT_SIGNUP_FUNNEL.DOB,
                    ],
                  };
                }

                await zohoCrmService.addAccounts(
                  ctx.request.zohoAccessToken,
                  dataSentInCrm
                );
              }
            }
            if (!userExists) return this.BadRequest(ctx, "User Not Found");

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
              accountCreated: accountCreated,
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
