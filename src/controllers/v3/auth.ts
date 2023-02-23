import { validations } from "../../validations/v2/apiValidation";
import { validationsV3 } from "../../validations/v3/apiValidation";
import {
  EGIFTSTACKCOINSSETTING,
  ENOTIFICATIONSETTINGS,
  EPHONEVERIFIEDSTATUS,
  EUSERSTATUS,
} from "../../types/user";
import moment from "moment";
import { TEEN_SIGNUP_FUNNEL } from "../../utility/constants";
import envData from "../../config/index";
import { Auth, PrimeTrustJWT } from "../../middleware";
import {
  AdminTable,
  CryptoTable,
  DeviceToken,
  OtpTable,
  ParentChildTable,
  TransactionTable,
  UserTable,
} from "../../model";
import {
  AuthService,
  userService,
  DeviceTokenService,
  SocialService,
  TokenService,
  zohoCrmService,
  ScriptService,
} from "../../services/v1/index";
import {
  EAUTOAPPROVAL,
  EOTPVERIFICATION,
  ETransactionStatus,
  ETransactionType,
  EUserType,
  HttpMethod,
} from "../../types";
import {
  getMinutesBetweenDates,
  createAccount,
  executeQuote,
  generateQuote,
  getJwtToken,
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
  @Route({ path: "/signup", method: HttpMethod.POST })
  @PrimeTrustJWT(true)
  public async handleSignup(ctx: any) {
    const reqParam = ctx.request.body;
    return validations.signupValidation(
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
                  firstName: reqParam.firstName
                    ? reqParam.firstName
                    : user.firstName,
                  lastName: reqParam.lastName
                    ? reqParam.lastName
                    : user.lastName,
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
            // If in staging environment, we need to manually KYC approve the account
            if (process.env.APP_ENVIRONMENT === "STAGING") {
              const resp = await ScriptService.sandboxApproveKYC(
                user._id,
                ctx.request.primeTrustToken
              );
            }
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
          parentEmail:
            checkParentExists && checkParentExists.email
              ? checkParentExists.email
              : null,
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
