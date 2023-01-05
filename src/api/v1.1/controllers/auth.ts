import { validationV1_1 } from "./../../../validations/apiValidationV1_1";
import {
  ENOTIFICATIONSETTINGS,
  EPHONEVERIFIEDSTATUS,
} from "./../../../types/user";
import { TEEN_SIGNUP_FUNNEL } from "./../../../utility/constants";
import Koa from "koa";
import moment from "moment";
import envData from "../../../config/index";
import { Auth, PrimeTrustJWT } from "../../../middleware";
import {
  AdminTable,
  CryptoTable,
  DeviceToken,
  OtpTable,
  ParentChildTable,
  TransactionTable,
  UserDraftTable,
  UserTable,
} from "../../../model";
import {
  AuthService,
  DeviceTokenService,
  SocialService,
  TokenService,
  TwilioService,
  zohoCrmService,
  userService,
} from "../../../services/v1/index";
import {
  EAUTOAPPROVAL,
  EGIFTSTACKCOINSSETTING,
  EOTPTYPE,
  EOTPVERIFICATION,
  ETransactionStatus,
  ETransactionType,
  EUSERSTATUS,
  EUserType,
  HttpMethod,
} from "../../../types";
import {
  createAccount,
  executeQuote,
  generateQuote,
  getJwtToken,
  getMinutesBetweenDates,
  getRefreshToken,
  internalAssetTransfers,
  makeUniqueReferalCode,
  Route,
} from "../../../utility";
import { PARENT_SIGNUP_FUNNEL } from "../../../utility/constants";
import { validation } from "../../../validations/apiValidation";
import BaseController from "../../v1/controllers/base";
import UserController from "../../v1.1/controllers/user";
import {
  UserDBServiceV1_1,
  TransactionDBServiceV1_1,
} from "../../../services/v1.1/index";

class AuthController extends BaseController {
  @Route({ path: "/login", method: HttpMethod.POST })
  public async handleLogin(ctx: Koa.Context) {
    const reqParam = ctx.request.body;
    return validation.loginValidation(
      reqParam,
      ctx,
      async (validate: boolean) => {
        if (validate) {
          try {
            const { email, deviceToken } = reqParam;
            if (!email) {
              return this.BadRequest(ctx, "Please enter email");
            }
            const userExists = await UserTable.findOne({ email: email });
            const userDraftExists = await UserDraftTable.findOne({
              email: email,
            });
            if (!userExists && !userDraftExists) {
              return this.BadRequest(
                ctx,
                "User not found, please signup first."
              );
            }
            const { token, refreshToken } = await TokenService.generateToken(
              userExists ? userExists : userDraftExists
            );

            const getProfileInput: any = {
              request: {
                query: { token },
                params: {
                  id: userExists ? userExists._id : userDraftExists._id,
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
              isFor: 2,
            });
          } catch (error) {
            return this.BadRequest(ctx, error.message);
          }
        }
      }
    );
  }

  @Route({ path: "/signup", method: HttpMethod.POST })
  @PrimeTrustJWT(true)
  public async handleSignup(ctx: any) {
    const reqParam = ctx.request.body;
    return validationV1_1.signupValidation(
      reqParam,
      ctx,
      async (validate: boolean) => {
        if (validate) {
          let childExists = null;
          let checkParentExists = null;
          let accountId = null;
          let parentChildInfoId = null;
          let parentChildInfo = null;
          let isGiftedStackCoins = 0;
          let accountNumber = null;
          const childArray = [];
          let user = null;
          let refferalCodeExists = null;
          const admin = await AdminTable.findOne({});
          /* tslint:disable-next-line */
          if (reqParam.type == EUserType.TEEN) {
            /**
             * TODO ADD CHILD ID
             */
            childExists = await UserTable.findOne({
              mobile: reqParam.mobile,
            });

            user = await UserTable.findOne({
              mobile: reqParam.parentMobile,
              type: EUserType.TEEN,
            });
            if (user) {
              return this.BadRequest(ctx, "Mobile Number Already Exists");
            }

            checkParentExists = await UserTable.findOne({
              mobile: reqParam.parentMobile,
              type: EUserType.PARENT,
            });

            parentChildInfo =
              checkParentExists?._id &&
              (await ParentChildTable.findOne({
                userId: checkParentExists._id,
              }));

            const checkCondition = (parentChildInfo?.teens || []).filter(
              (x: any) => x.childId.toString() == childExists.id.toString()
            );
            if (
              checkParentExists &&
              checkParentExists.status == EUSERSTATUS.KYC_DOCUMENT_VERIFIED &&
              checkCondition.length == 0
            ) {
              if (!parentChildInfo) {
                return this.BadRequest(ctx, "Account Details Not Found");
              }
              parentChildInfoId = parentChildInfo._id;

              /**
               * Create Prime Trust Account for other child as well
               * TODO
               */
              let childName = childExists.lastName
                ? childExists.firstName + " " + childExists.lastName
                : childExists.firstName;
              const data = {
                type: "account",
                attributes: {
                  "account-type": "custodial",
                  name:
                    childName +
                    " - " +
                    checkParentExists.firstName +
                    " " +
                    checkParentExists.lastName +
                    " - " +
                    parentChildInfo.contactId,
                  "authorized-signature":
                    checkParentExists.firstName +
                    " - " +
                    checkParentExists.lastName,
                  "webhook-config": {
                    url: envData.WEBHOOK_URL,
                  },
                  "contact-id": parentChildInfo.contactId,
                },
              };
              const createAccountData: any = await createAccount(
                ctx.request.primeTrustToken,
                data
              );
              if (createAccountData.status == 400) {
                return this.BadRequest(ctx, createAccountData.message);
              }
              accountNumber = createAccountData.data.data.attributes.number;
              accountId = createAccountData.data.data.id;
            }
          } else {
            /**
             * Parent flow and self flow
             */
            user = await AuthService.findUserByEmail(reqParam.email);

            if (
              new Date(
                Date.now() - new Date(reqParam.dob).getTime()
              ).getFullYear() < 1988
            ) {
              return this.BadRequest(
                ctx,
                reqParam.type == EUserType.PARENT
                  ? "Parent's age should be 18+"
                  : "Your age should be 18+"
              );
            }
            if (reqParam.type == EUserType.PARENT) {
              const parentMobileExistInChild = await UserTable.findOne({
                parentMobile: reqParam.mobile,
              });
              if (!parentMobileExistInChild) {
                return this.BadRequest(
                  ctx,
                  "Sorry , We cannot find this email/mobile in teen."
                );
              }
              childExists = await UserTable.findOne({
                mobile: reqParam.childMobile,
              });
              if (!childExists) {
                return this.BadRequest(
                  ctx,
                  "Teen Mobile Number Doesn't Exists"
                );
              }
              if (childExists.parentMobile !== reqParam.mobile) {
                return this.BadRequest(
                  ctx,
                  "Sorry We cannot find your accounts. Unable to link them"
                );
              }
              const childDetails = await UserTable.find(
                {
                  type: EUserType.TEEN,
                  parentMobile: reqParam.mobile,
                },
                {
                  _id: 1,
                }
              );
              if (childDetails.length == 0) {
                return this.BadRequest(
                  ctx,
                  "Teen Mobile Number Doesn't Exists"
                );
              }
              for await (const child of childDetails) {
                childArray.push({ childId: child._id, accountId: null });
              }
            }
          }

          await SocialService.verifySocial(reqParam);

          if (reqParam.type == EUserType.TEEN && childExists) {
            let updateQuery: any = {
              username: null,
              password: null,
              taxIdNo: reqParam.taxIdNo ? reqParam.taxIdNo : null,
              isParentFirst: childExists.isParentFirst,
              isNotificationOn: ENOTIFICATIONSETTINGS.ON,
            };

            user = await UserTable.findByIdAndUpdate(
              { _id: childExists._id },
              {
                $set: updateQuery,
              },
              { new: true }
            );
          } else {
            /**
             * Generate referal code when user sign's up.
             */

            user = await UserTable.findOneAndUpdate(
              { email: reqParam.email },
              {
                $set: {
                  username: null,
                  password: null,
                  mobile: reqParam.mobile,
                  parentEmail: reqParam.parentEmail
                    ? reqParam.parentEmail
                    : null,
                  parentMobile: reqParam.parentMobile
                    ? reqParam.parentMobile
                    : null,
                  preLoadedCoins:
                    isGiftedStackCoins > 0 ? isGiftedStackCoins : 0,
                  isNotificationOn: ENOTIFICATIONSETTINGS.ON,
                  isAutoApproval: EAUTOAPPROVAL.ON,
                  taxIdNo: reqParam.taxIdNo,
                  country: reqParam.country,
                  state: reqParam.state,
                  city: reqParam.city,
                  address: reqParam.address,
                  unitApt: reqParam.unitApt,
                  postalCode: reqParam.postalCode,
                },
              },
              { new: true }
            );
          }

          if (
            accountId &&
            accountNumber &&
            user.type != EUserType.PARENT &&
            user.type != EUserType.SELF
          ) {
            /**
             * TODO
             */
            await ParentChildTable.updateOne(
              {
                _id: parentChildInfoId,
              },
              {
                $push: {
                  teens: {
                    childId: user._id,
                    accountId: accountId,
                    accountNumber: accountNumber,
                  },
                },
              }
            );
          }

          if (
            admin.giftCryptoSetting == 1 &&
            user.isGiftedCrypto == 0 &&
            user.type == EUserType.TEEN
          ) {
            let crypto = await CryptoTable.findOne({ symbol: "BTC" });
            let checkTransactionExistsAlready = await TransactionTable.findOne({
              userId:
                checkParentExists && parentChildInfo
                  ? parentChildInfo.firstChildId
                  : user._id,
              intialDeposit: true,
              type: ETransactionType.DEPOSIT,
            });
            if (checkTransactionExistsAlready) {
              let parentChildTableExists = await ParentChildTable.findOne({
                "teens.childId": user._id,
              });
              const accountIdDetails: any = parentChildTableExists.teens.find(
                (x: any) => x.childId.toString() == user._id.toString()
              );
              const requestQuoteDay: any = {
                data: {
                  type: "quotes",
                  attributes: {
                    "account-id": envData.OPERATIONAL_ACCOUNT,
                    "asset-id": crypto.assetId,
                    hot: true,
                    "transaction-type": "buy",
                    total_amount: "5",
                  },
                },
              };
              const generateQuoteResponse: any = await generateQuote(
                ctx.request.primeTrustToken,
                requestQuoteDay
              );
              if (generateQuoteResponse.status == 400) {
                return this.BadRequest(ctx, generateQuoteResponse.message);
              }
              /**
               * Execute a quote
               */
              const requestExecuteQuote: any = {
                data: {
                  type: "quotes",
                  attributes: {
                    "account-id": accountIdDetails.accountId,
                    "asset-id": crypto.assetId,
                  },
                },
              };
              const executeQuoteResponse: any = await executeQuote(
                ctx.request.primeTrustToken,
                generateQuoteResponse.data.data.id,
                requestExecuteQuote
              );
              if (executeQuoteResponse.status == 400) {
                return this.BadRequest(ctx, executeQuoteResponse.message);
              }
              let internalTransferRequest = {
                data: {
                  type: "internal-asset-transfers",
                  attributes: {
                    "unit-count":
                      executeQuoteResponse.data.data.attributes["unit-count"],
                    "from-account-id": envData.OPERATIONAL_ACCOUNT,
                    "to-account-id": accountIdDetails.accountId,
                    "asset-id": crypto.assetId,
                    reference: "$5 BTC gift from Stack",
                    "hot-transfer": true,
                  },
                },
              };
              const internalTransferResponse: any =
                await internalAssetTransfers(
                  ctx.request.primeTrustToken,
                  internalTransferRequest
                );
              if (internalTransferResponse.status == 400) {
                return this.BadRequest(ctx, internalTransferResponse.message);
              }
              await TransactionTable.create({
                assetId: crypto.assetId,
                cryptoId: crypto._id,
                accountId: accountIdDetails.accountId,
                type: ETransactionType.BUY,
                settledTime: moment().unix(),
                amount: admin.giftCryptoAmount,
                amountMod: -admin.giftCryptoAmount,
                userId: user._id,
                parentId: parentChildTableExists.userId,
                status: ETransactionStatus.SETTLED,
                executedQuoteId: internalTransferResponse.data.data.id,
                unitCount:
                  executeQuoteResponse.data.data.attributes["unit-count"],
              });
              await UserTable.updateOne(
                {
                  _id: user._id,
                },
                {
                  $set: {
                    isGiftedCrypto: 2,
                  },
                }
              );
            } else {
              /**
               * bitcoin asset id and crypto id
               */

              await TransactionDBServiceV1_1.createBtcGiftedTransaction(
                user._id,
                crypto,
                admin
              );
            }
          }
          /**
           * Gift Stack Coins and add entry in zoho
           */
          if (
            user.type == EUserType.TEEN &&
            user.isGifted == EGIFTSTACKCOINSSETTING.OFF &&
            admin.giftStackCoinsSetting == EGIFTSTACKCOINSSETTING.ON &&
            checkParentExists &&
            parentChildInfo &&
            checkParentExists.status == EUSERSTATUS.KYC_DOCUMENT_VERIFIED &&
            parentChildInfo.firstChildId != user._id
          ) {
            /**
             * Added in zoho
             */
            let dataSentInCrm: any = {
              Account_Name: user.firstName + " " + user.lastName,
              Email: user.email,
              Stack_Coins: admin.stackCoins,
            };
            await zohoCrmService.addAccounts(
              ctx.request.zohoAccessToken,
              dataSentInCrm
            );
            user = await UserTable.findByIdAndUpdate(
              { _id: user._id },
              {
                $set: {
                  isGifted: EGIFTSTACKCOINSSETTING.ON,
                },

                $inc: {
                  preLoadedCoins: admin.stackCoins,
                },
              },
              { new: true }
            );
          }

          if (reqParam.deviceToken) {
            let checkDeviceTokenExists: any = await DeviceToken.findOne({
              userId: user._id,
            });
            if (!checkDeviceTokenExists) {
              checkDeviceTokenExists = await DeviceToken.create({
                userId: user._id,
                "deviceToken.0": reqParam.deviceToken,
              });
            } else {
              if (
                !checkDeviceTokenExists.deviceToken.includes(
                  reqParam.deviceToken
                )
              ) {
                checkDeviceTokenExists = await DeviceToken.updateOne(
                  { _id: checkDeviceTokenExists._id },
                  {
                    $push: {
                      deviceToken: reqParam.deviceToken,
                    },
                  },
                  { new: true }
                );
              }
            }
          }

          /**
           * Refferal code present or not
           */
          if (reqParam.refferalCode) {
            refferalCodeExists = await UserTable.findOne({
              referralCode: reqParam.refferalCode,
            });
            if (!refferalCodeExists) {
              return this.BadRequest(
                ctx,
                "Refferal code not associated with any account"
              );
            }

            /**
             * add referral code number as well
             */
            let senderName = refferalCodeExists.lastName
              ? refferalCodeExists.firstName + " " + refferalCodeExists.lastName
              : refferalCodeExists.firstName;

            let receiverName = user.lastName
              ? user.firstName + " " + user.lastName
              : user.firstName;

            await userService.updateOrCreateUserReferral(
              refferalCodeExists._id,
              user._id,
              senderName,
              receiverName,
              reqParam.type
            );

            if (
              (user.type == EUserType.PARENT || user.type == EUserType.SELF) &&
              user.status == EUSERSTATUS.KYC_DOCUMENT_VERIFIED
            ) {
              await userService.redeemUserReferral(
                refferalCodeExists._id,
                [user._id],
                reqParam.refferalCode
              );
            } else if (
              user.type == EUserType.TEEN &&
              checkParentExists &&
              parentChildInfo &&
              checkParentExists.status == EUSERSTATUS.KYC_DOCUMENT_VERIFIED
            ) {
              await userService.redeemUserReferral(
                refferalCodeExists._id,
                [user._id],
                reqParam.refferalCode
              );
            }
          }

          const authInfo = await AuthService.getJwtAuthInfo(user);
          const refreshToken = await getRefreshToken(authInfo);
          user.refreshToken = refreshToken;
          await user.save();
          const token = await getJwtToken(authInfo);
          let getProfileInput: any = {
            request: {
              query: { token },
              headers: {},
              params: { id: user._id },
            },
          };

          /**
           * TODO:- ZOHO CRM ADD ACCOUNTS DATA
           */
          let dataSentInCrm: any = {
            Account_Name: user.lastName
              ? user.firstName + " " + user.lastName
              : user.firstName,
            First_Name: user.firstName,
            Last_Name: user.lastName ? user.lastName : null,
            Email: user.email,
            Mobile: user.mobile.replace("+", ""),
            Account_Type:
              user.type == EUserType.PARENT
                ? "Parent"
                : user.type == EUserType.SELF
                ? "Self"
                : "Teen",
            Birthday: user.dob,
            User_ID: user._id,
          };
          if (user.type == EUserType.PARENT || user.type == EUserType.SELF) {
            dataSentInCrm = {
              ...dataSentInCrm,
              Parent_Signup_Funnel: [
                ...PARENT_SIGNUP_FUNNEL.SIGNUP,
                PARENT_SIGNUP_FUNNEL.DOB,
                PARENT_SIGNUP_FUNNEL.MOBILE_NUMBER,
                PARENT_SIGNUP_FUNNEL.CHILD_INFO,
                PARENT_SIGNUP_FUNNEL.CONFIRM_DETAILS,
              ],
              Parent_Number: reqParam.mobile.replace("+", ""),
              ...(user.type == EUserType.PARENT && {
                Teen_Number: reqParam.childMobile.replace("+", ""),
                Teen_Name: reqParam.childLastName
                  ? reqParam.childFirstName + " " + reqParam.childLastName
                  : reqParam.childFirstName,
              }),
            };
          }
          if (user.type == EUserType.TEEN) {
            dataSentInCrm = {
              ...dataSentInCrm,
              Parent_Account: checkParentExists
                ? checkParentExists.lastName
                  ? checkParentExists.firstName +
                    " " +
                    checkParentExists.lastName
                  : checkParentExists.firstName
                : null,
              Parent_Number: reqParam.parentMobile.replace("+", ""),
              Teen_Number: reqParam.mobile.replace("+", ""),
              Teen_Name: reqParam.lastName
                ? reqParam.firstName + " " + reqParam.lastName
                : reqParam.firstName,
              Teen_Signup_Funnel: [
                TEEN_SIGNUP_FUNNEL.SIGNUP,
                TEEN_SIGNUP_FUNNEL.DOB,
                TEEN_SIGNUP_FUNNEL.PHONE_NUMBER,
                TEEN_SIGNUP_FUNNEL.PARENT_INFO,
                TEEN_SIGNUP_FUNNEL.SUCCESS,
              ],
            };
          }
          await zohoCrmService.addAccounts(
            ctx.request.zohoAccessToken,
            dataSentInCrm
          );
          if (user.type == EUserType.PARENT) {
            let dataSentAgain = {
              data: [
                {
                  Account_Name: childExists.lastName
                    ? childExists.firstName + " " + childExists.lastName
                    : childExists.firstName,
                  Email: childExists.email,
                  Parent_Account: {
                    name: user.lastName
                      ? user.firstName + " " + user.lastName
                      : user.firstName,
                  },
                },
              ],
            };
            await zohoCrmService.addAccounts(
              ctx.request.zohoAccessToken,
              dataSentAgain
            );
          }
          await UserController.getProfile(getProfileInput);
          return this.Ok(ctx, {
            token,
            refreshToken,
            profileData: getProfileInput.body.data,
            message:
              /* tslint:disable-next-line */
              reqParam.type == EUserType.TEEN
                ? `We have sent sms/email to your parent. Once he starts onboarding process you can have access to full features of this app.`
                : `Your account is created successfully. Please fill other profile details as well.`,
          });
        }
      }
    );
  }

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
            let updateUser = await UserDraftTable.findByIdAndUpdate(
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

              const newUserDetail = await UserDBServiceV1_1.createUserAccount(
                updateUser,
                reqParam.mobile
              );

              migratedId = newUserDetail._id;
              await UserDraftTable.deleteOne({
                _id: ctx.request.user._id,
              });

              let checkTransactionExists = await TransactionTable.findOne({
                userId: newUserDetail._id,
              });
              if (
                admin.giftCryptoSetting == 1 &&
                newUserDetail.isGiftedCrypto == 0 &&
                !checkTransactionExists
              ) {
                await TransactionDBServiceV1_1.createBtcGiftedTransaction(
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
   * @description This method is used to confirm mobile number
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/confirm-mobile-number", method: HttpMethod.POST })
  public async confirmMobileNumber(ctx) {
    const input = ctx.request.body;
    return validation.confirmMobileNumberValidation(
      input,
      ctx,
      async (validate) => {
        if (validate) {
          const { mobile } = input;

          try {
            await TwilioService.sendOTP(mobile, EOTPTYPE.SIGN_UP);
            return this.Ok(ctx, {
              message:
                "We have sent you code in order to proceed your request of confirming mobile number. Please check your phone.",
            });
          } catch (error) {
            return this.BadRequest(ctx, error.message);
          }
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
    return validationV1_1.checkValidMobileValidation(
      input,
      ctx,
      async (validate) => {
        if (validate) {
          const { mobile, type } = input;

          if (type == EUserType.TEEN) {
            let userExists = await UserTable.findOne({
              $or: [{ mobile: mobile }, { parentMobile: mobile }],
            });
            if (userExists) {
              if (userExists.isParentFirst == true) {
                return this.Ok(ctx, { message: "Success" });
              }

              return this.BadRequest(ctx, "Mobile Number Already Exists");
            }
          } else if (type == EUserType.PARENT || type == EUserType.SELF) {
            let userExists = await UserTable.findOne({
              mobile: mobile,
            });

            if (userExists) {
              return this.BadRequest(ctx, "Mobile Number Already Exists");
            }
          } else {
            return this.BadRequest(ctx, "Invalid User Type");
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
            parentMobile: mobile,
          };
          let migratedId;
          let userResponse;
          const admin = await AdminTable.findOne({});
          const crypto = await CryptoTable.findOne({ symbol: "BTC" });
          let parentRecord = await UserTable.findOne({ mobile: mobile });
          let parentInUserDraft = await UserDraftTable.findOne({
            _id: ctx.request.user._id,
          });

          /**
           * migrate parent from userdraft to user table
           */

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
            const teenUserInfo = await UserTable.findByIdAndUpdate(
              {
                _id: user._id,
              },
              {
                $set: baseChildUser,
              },
              { new: true }
            );

            const transactionExists = await TransactionTable.findOne({
              userId: teenUserInfo._id,
              status: ETransactionStatus.GIFTED,
            });

            if (!transactionExists) {
              await TransactionDBServiceV1_1.createBtcGiftedTransaction(
                teenUserInfo._id,
                crypto,
                admin
              );
            }

            const createObject = {
              email: parentInUserDraft.email,
              dob: parentInUserDraft.dob,
              type: parentInUserDraft.type,
              mobile: input.mobile,
              firstName: parentInUserDraft.firstName,
              lastName: parentInUserDraft.lastName,
              referralCode: parentInUserDraft.referralCode,
              isPhoneVerified: parentInUserDraft.isPhoneVerified
            };

            if (!parentRecord && parentInUserDraft) {
              if (
                (parentInUserDraft.type == EUserType.PARENT ||
                  parentInUserDraft.type == EUserType.SELF) &&
                parentInUserDraft
              ) {
                userResponse = await UserTable.create(createObject);
                migratedId = userResponse._id.toString();
                await UserDraftTable.deleteOne({ _id: ctx.request.user._id });
              }
            }

            await ParentChildTable.findOneAndUpdate(
              {
                userId: userResponse._id,
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

            if (!parentRecord && !parentInUserDraft) {
              return this.BadRequest(ctx, "User not found");
            }

            /**
             * Add zoho crm
             */
            if (parentRecord) {
              await zohoCrmService.searchAccountsAndUpdateDataInCrm(
                ctx.request.zohoAccessToken,
                childMobile ? childMobile : user.mobile,
                parentRecord,
                "false"
              );
            }

            return this.Ok(ctx, {
              message: "Account successfully linked!",
              migratedId: migratedId,
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
          const uniqueReferralCode = await makeUniqueReferalCode();
          const createTeenObject = {
            ...baseChildUser,
            email: childEmail,
            referralCode: uniqueReferralCode,
            isParentFirst: true,
          };
          let createChild = await UserTable.create(createTeenObject);

          await TransactionDBServiceV1_1.createBtcGiftedTransaction(
            createChild._id,
            crypto,
            admin
          );

          const createObject = {
            email: parentInUserDraft.email,
            dob: parentInUserDraft.dob,
            type: parentInUserDraft.type,
            mobile: input.mobile,
            firstName: parentInUserDraft.firstName,
            lastName: parentInUserDraft.lastName,
            referralCode: parentInUserDraft.referralCode,
            isPhoneVerified: parentInUserDraft.isPhoneVerified
          };

          if (!parentRecord && parentInUserDraft) {
            if (
              (parentInUserDraft.type == EUserType.PARENT ||
                parentInUserDraft.type == EUserType.SELF) &&
              parentInUserDraft
            ) {
              userResponse = await UserTable.create(createObject);
              migratedId = userResponse._id.toString();
              await UserDraftTable.deleteOne({ _id: ctx.request.user._id });
            }
          }

          await ParentChildTable.findOneAndUpdate(
            {
              userId: userResponse._id,
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

          if (!parentRecord && !parentInUserDraft) {
            return this.BadRequest(ctx, "User not found");
          }

          /**
           * Add zoho crm
           */
          if (parentRecord) {
            await zohoCrmService.searchAccountsAndUpdateDataInCrm(
              ctx.request.zohoAccessToken,
              childMobile ? childMobile : user.mobile,
              parentRecord,
              "true"
            );
          }
          return this.Ok(ctx, {
            message: "Invite sent!",
            migratedId: migratedId,
            isAccountFound: false,
          });
        }
      }
    );
  }

  /**
   * @description This api is used for logout
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/logout", method: HttpMethod.POST })
  @Auth()
  public async logout(ctx: any) {
    const reqParam = ctx.request.body;
    const user = await UserTable.findOne({ _id: ctx.request.user._id });
    if (!user) {
      return this.BadRequest(ctx, "User Not Found");
    }
    return validation.logoutValidation(
      reqParam,
      ctx,
      async (validate: boolean) => {
        if (validate) {
          await DeviceTokenService.removeDeviceToken(
            user._id,
            reqParam.deviceToken
          );
          return this.Ok(ctx, { message: "Logout Successfully" });
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
    let migratedId;
    if (!ctx.request.body.parentMobile) {
      return this.BadRequest(ctx, "Please enter parent's mobile");
    }
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
    if (ctx.request.body.parentMobile) {
      let childAlreadyExists = await UserTable.findOne({
        mobile: ctx.request.body.mobile,
      });
      const childInfo = await UserDraftTable.findOne({
        _id: ctx.request.user._id,
      });

      const updateOrCreateObject = {
        email: childInfo.email,
        dob: childInfo.dob,
        type: childInfo.type,
        mobile: ctx.request.body.mobile,
        parentMobile: ctx.request.body.parentMobile,
        parentEmail:
          checkParentExists && checkParentExists.type == EUserType.PARENT
            ? checkParentExists.email
            : null,
        firstName: childInfo.firstName
          ? childInfo.firstName
          : childAlreadyExists.firstName,
        lastName: childInfo.lastName
          ? childInfo.lastName
          : childAlreadyExists.lastName,
        referralCode: childInfo.referralCode
          ? childInfo.referralCode
          : childAlreadyExists.referralCode,
        isPhoneVerified: childInfo.isPhoneVerified
          ? childInfo.isPhoneVerified
          : childAlreadyExists.isPhoneVerified,
      };

      if (childAlreadyExists && childInfo) {
        await UserTable.findOneAndUpdate(
          { mobile: ctx.request.body.mobile },
          { $set: updateOrCreateObject },
          { new: true }
        );

        migratedId = childAlreadyExists ? childAlreadyExists._id : "";
      } else {
        const userResponse = await UserTable.create(updateOrCreateObject);
        migratedId = userResponse._id;
      }

      await UserDraftTable.deleteOne({
        _id: ctx.request.user._id,
      });
    }

    if (checkParentExists) {
      await zohoCrmService.searchAccountsAndUpdateDataInCrm(
        ctx.request.zohoAccessToken,
        ctx.request.body.mobile,
        checkParentExists,
        "true"
      );
    }

    return this.Ok(
      ctx,
      !checkParentExists
        ? { message: "User Not Found", isAccountFound: false, migratedId }
        : { message: "Success", isAccountFound: true, migratedId }
    );
  }

  /**
   * @description This method will be used to verify social id token and email in case of user registration and if email not verified create a user
   */
  @Route({ path: "/check-user-signup", method: HttpMethod.POST })
  @PrimeTrustJWT(true)
  public async checkSignUp(ctx: any) {
    const reqParam = ctx.request.body;
    return validation.checkUserSignupValidation(
      reqParam,
      ctx,
      async (validate: boolean) => {
        if (validate) {
          try {
            const { email, deviceToken } = reqParam;
            const userExists = await UserTable.findOne({ email });
            let userDraftInfo = await UserDraftTable.findOne({ email });
            await SocialService.verifySocial(reqParam);
            const uniqueReferralCode = await makeUniqueReferalCode();
            if (!userExists && !userDraftInfo) {
              const createQuery: any = {
                email: reqParam.email,
                firstName: reqParam.firstName ? reqParam.firstName : null,
                lastName: reqParam.lastName ? reqParam.lastName : null,
                referralCode: uniqueReferralCode,
              };
              userDraftInfo = await UserDraftTable.create(createQuery);
              if (userDraftInfo) {
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
              }
            }

            const { token, refreshToken } = await TokenService.generateToken(
              userExists !== null ? userExists : userDraftInfo
            );

            let getProfileInput: any = {
              request: {
                query: { token },
                params: {
                  id: userExists !== null ? userExists._id : userDraftInfo._id,
                },
              },
            };
            await UserController.getProfile(getProfileInput);

            if (deviceToken) {
              await DeviceTokenService.addDeviceTokenIfNeeded(
                userExists !== null ? userExists._id : userDraftInfo._id,
                deviceToken
              );
            }

            return this.Ok(ctx, {
              token,
              refreshToken,
              profileData: getProfileInput.body.data,
              message: "Success",
              isUserExist: userExists ? true : false,
            });
          } catch (error) {
            return this.BadRequest(ctx, error.message);
          }
        }
      }
    );
  }

  /**
   * @description This method will check the dob and update the dob along with the screen status
   */
  @Route({ path: "/check-dob", method: HttpMethod.POST })
  @Auth()
  @PrimeTrustJWT(true)
  public async checkDob(ctx: any) {
    const reqParam = ctx.request.body;
    return validation.dobValidation(
      reqParam,
      ctx,
      async (validate: boolean) => {
        if (validate) {
          try {
            const isUserBelow18 =
              new Date(
                Date.now() - new Date(reqParam.dob).getTime()
              ).getFullYear() < 1988;

            let baseObject = {
              dob: reqParam.dob,
            };

            let updateObject = !isUserBelow18
              ? baseObject
              : {
                  ...baseObject,
                  type: EUserType.TEEN,
                };

            const userScreenStatusUpdate =
              await UserDraftTable.findByIdAndUpdate(
                {
                  _id: ctx.request.user._id,
                },
                {
                  $set: updateObject,
                },
                { new: true }
              );
            /**
             * Zoho crm account addition
             */
            let dataSentInCrm: any = {
              Account_Name:
                userScreenStatusUpdate.firstName +
                " " +
                userScreenStatusUpdate.lastName,
              Email: userScreenStatusUpdate.email,
              Birthday: userScreenStatusUpdate.dob,
            };

            if (isUserBelow18) {
              dataSentInCrm = {
                ...dataSentInCrm,
                Account_Type:
                  userScreenStatusUpdate.type == EUserType.TEEN ? "Teen" : "",
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
            return this.Ok(ctx, {
              message: "Dob saved",
              userScreenStatusUpdate,
            });
          } catch (error) {
            return this.BadRequest(ctx, error.message);
          }
        }
      }
    );
  }

  /**
   * @description This method will be used to check the type and then update type and screen status
   */
  @Route({ path: "/check-type", method: HttpMethod.POST })
  @Auth()
  @PrimeTrustJWT(true)
  public async checkType(ctx: any) {
    const reqParam = ctx.request.body;
    return validation.typeValidation(
      reqParam,
      ctx,
      async (validate: boolean) => {
        if (validate) {
          try {
            let userTypeScreenUpdate: any;

            if (
              reqParam.type === EUserType.PARENT ||
              reqParam.type === EUserType.SELF
            ) {
              userTypeScreenUpdate = await UserDraftTable.findByIdAndUpdate(
                {
                  _id: ctx.request.user._id,
                },
                {
                  $set: {
                    type: reqParam.type,
                  },
                },
                { new: true }
              );
              /**
               * Zoho crm account addition
               */
              let dataSentInCrm: any = {
                Account_Name:
                  userTypeScreenUpdate.firstName +
                  " " +
                  userTypeScreenUpdate.lastName,
                Email: userTypeScreenUpdate.email,
                Account_Type:
                  reqParam.type == EUserType.PARENT ? "Parent" : "Self",
              };
              await zohoCrmService.addAccounts(
                ctx.request.zohoAccessToken,
                dataSentInCrm
              );
              return this.Ok(ctx, {
                message: "Dob saved",
                userTypeScreenUpdate,
              });
            }
          } catch (error) {
            return this.BadRequest(ctx, error.message);
          }
        }
      }
    );
  }
}

export default new AuthController();
