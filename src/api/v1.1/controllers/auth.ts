import { validationV1_1 } from "./../../../validations/apiValidationV1_1";
import { request } from "request";
import { ENOTIFICATIONSETTINGS } from "./../../../types/user";
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
  StateTable,
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
} from "../../../services";
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
  decodeJwtToken,
  executeQuote,
  generateQuote,
  generateTempPassword,
  getJwtToken,
  getMinutesBetweenDates,
  getRefreshToken,
  hashString,
  internalAssetTransfers,
  makeUniqueReferalCode,
  Route,
  sendEmail,
  verifyToken,
} from "../../../utility";
import {
  CONSTANT,
  NOTIFICATION,
  NOTIFICATION_KEYS,
  PARENT_SIGNUP_FUNNEL,
} from "../../../utility/constants";
import { validation } from "../../../validations/apiValidation";
import BaseController from "./base";
import UserController from "../../v1/controllers/user";

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
            let userExists = await UserTable.findOne({ email: email });
            let userDraftExists = await UserDraftTable.findOne({
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

            let getProfileInput: any = {
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
          let admin = await AdminTable.findOne({});
          /* tslint:disable-next-line */
          if (reqParam.type == EUserType.TEEN) {
            /**
             * TODO ADD CHILD ID
             */
            childExists = await UserTable.findOne({
              mobile: reqParam.mobile,
            });
            // if (childExists && childExists.isParentFirst == false) {
            //   return this.BadRequest(
            //     ctx,
            //     "Your account is already created. Please log in"
            //   );
            // }
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
          if (reqParam.type == EUserType.PARENT) {
            await ParentChildTable.findOneAndUpdate(
              {
                userId: user._id,
              },
              {
                $set: {
                  contactId: null,
                  firstChildId: childExists._id,
                  teens: childArray,
                },
              },
              { upsert: true, new: true }
            );
          } else if (reqParam.type == EUserType.SELF) {
            await ParentChildTable.create({
              userId: user._id,
              firstChildId: user._id,
            });
          } else {
            if (accountId && accountNumber) {
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
          }
          if (
            admin.giftCryptoSetting == 1 &&
            user.isGiftedCrypto == 0 &&
            user.type !== EUserType.PARENT
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
              await TransactionTable.create({
                assetId: crypto.assetId,
                cryptoId: crypto._id,
                accountId: null,
                type: ETransactionType.BUY,
                settledTime: moment().unix(),
                amount: admin.giftCryptoAmount,
                amountMod: 0,
                userId: user._id,
                parentId: null,
                status: ETransactionStatus.GIFTED,
                executedQuoteId: null,
                unitCount: 0,
              });
              await UserTable.updateOne(
                { _id: user._id },
                {
                  $set: {
                    isGiftedCrypto: 1,
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
                PARENT_SIGNUP_FUNNEL.CONFIRM_DETAILS,
                PARENT_SIGNUP_FUNNEL.CHILD_INFO,
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
   * @description This method will be used to verify social id token and email in case of user registration
   */
  @Route({ path: "/check-signup", method: HttpMethod.POST })
  public async checkUserSignUp(ctx: any) {
    const reqParam = ctx.request.body;
    return validation.checkUserSignupValidation(
      reqParam,
      ctx,
      async (validate: boolean) => {
        if (validate) {
          try {
            const { email, deviceToken } = reqParam;
            let userExists = await UserTable.findOne({ email });
            if (!userExists) {
              const createObject = {
                email: reqParam.email,
                refreshToken: reqParam.socialLoginToken,
                firstName: reqParam.firstName,
                lastName: reqParam.lastName,
              };

              const createUserDraft: any = await UserDraftTable.create(
                createObject
              );
              if (createUserDraft) {
                await SocialService.verifySocial(reqParam);

                const { token, refreshToken } =
                  await TokenService.generateToken(createUserDraft);

                let getProfileInput: any = {
                  request: {
                    query: { token },
                    params: { id: createUserDraft._id },
                  },
                };
                await UserController.getProfile(getProfileInput);

                await DeviceTokenService.addDeviceTokenIfNeeded(
                  createUserDraft._id,
                  deviceToken
                );

                return this.Ok(ctx, {
                  token,
                  refreshToken,
                  profileData: getProfileInput.body.data,
                  message: "Success",
                });
              }
            } else {
              await SocialService.verifySocial(reqParam);

              const { token, refreshToken } = await TokenService.generateToken(
                userExists
              );

              let getProfileInput: any = {
                request: {
                  query: { token },
                  params: { id: userExists._id },
                },
              };
              await UserController.getProfile(getProfileInput);

              await DeviceTokenService.addDeviceTokenIfNeeded(
                userExists._id,
                deviceToken
              );

              return this.Ok(ctx, {
                token,
                refreshToken,
                profileData: getProfileInput.body.data,
                message: "Success",
              });
            }
          } catch (error) {
            return this.BadRequest(ctx, error.message);
          }
        }
      }
    );
  }

  @Route({ path: "/token-login", method: HttpMethod.POST })
  public async handleTokenLogin(ctx: Koa.Context) {
    const token = ctx.request.body.token;
    if (!token) {
      return this.BadRequest(ctx, "Token required");
    }

    const authInfo = verifyToken(token);

    const user = await AuthService.findUserByEmail(authInfo.email);
    if (!user) {
      return this.BadRequest(ctx, "User not found");
    }

    return this.Ok(ctx, user);
  }

  /**
   * This method is used to change password of user
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/change-password", method: HttpMethod.POST })
  @Auth()
  public async changePassword(ctx: any) {
    const user = ctx.request.user;
    const reqParam = ctx.request.body;
    const userExists = await UserTable.findOne({ _id: user._id });
    if (!reqParam.old_password) {
      return this.BadRequest(ctx, "Please enter old password");
    }
    const checkOldPassword = await AuthService.comparePassword(
      reqParam.old_password,
      userExists.password
    );
    if (checkOldPassword === false) {
      return this.BadRequest(ctx, "Old Password is Incorrect");
    }
    return validation.changePasswordValidation(
      reqParam,
      ctx,
      async (validate: boolean) => {
        if (validate) {
          /**
           * #Conditions to check
           * 1) check old password is correct
           * 2) check old password not equal to new password
           */
          return UserTable.findOne({ _id: user._id }).then(
            async (userData: any) => {
              if (!userData) {
                return this.NotFound(ctx, "User Not Found");
              }
              const compareNewPasswordWithOld =
                await AuthService.comparePassword(
                  reqParam.new_password,
                  userData.password
                );
              if (compareNewPasswordWithOld === true) {
                return this.BadRequest(
                  ctx,
                  "New Password should not be similiar to Old Password"
                );
              }
              const newPassword = await AuthService.encryptPassword(
                reqParam.new_password
              );
              await UserTable.updateOne(
                { _id: user._id },
                {
                  $set: {
                    password: newPassword,
                  },
                }
              );
              return this.Ok(ctx, { message: "Password Changed Successfully" });
            }
          );
        }
      }
    );
  }

  /**
   * This method is used to change address of user
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/change-address", method: HttpMethod.POST })
  @Auth()
  public changeAddress(ctx: any) {
    const user = ctx.request.user;
    const reqParam = ctx.request.body;
    return validation.changeAddressValidation(
      reqParam,
      ctx,
      async (validate: boolean) => {
        if (validate) {
          let state = await StateTable.findOne({ _id: reqParam.stateId });
          if (!state) return this.BadRequest(ctx, "Invalid State-ID entered.");
          await UserTable.updateOne(
            { _id: user._id },
            {
              $set: {
                address: reqParam.address,
                unitApt: reqParam.unitApt ? reqParam.unitApt : null,
                postalCode: reqParam.postalCode,
                stateId: reqParam.stateId,
                taxState: reqParam.stateId,
                tax: reqParam.stateId,
                city: reqParam.city,
              },
            }
          );
          return this.Ok(ctx, { message: "Address Changed Successfully" });
        }
      }
    );
  }

  /**
   * This method is used to change email of user
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/change-email", method: HttpMethod.POST })
  @Auth()
  public async changeEmail(ctx: any) {
    const user = ctx.request.user;
    const reqParam = ctx.request.body;
    const userExists = await UserTable.findOne({ id: user.id });
    if (!userExists) {
      return this.BadRequest(ctx, "User not found");
    }
    const userData = await UserTable.findOne({ email: reqParam.email });
    if (userData !== null) {
      return this.BadRequest(ctx, "You cannot add same email address");
    }
    if (userExists.type === EUserType.TEEN) {
      const parentEmailExists = await UserTable.findOne({
        parentMobile: reqParam.email,
      });
      if (parentEmailExists) {
        return this.BadRequest(
          ctx,
          "You cannot add same email address as in parent"
        );
      }
    }
    return validation.changeEmailValidation(
      reqParam,
      ctx,
      async (validate: boolean) => {
        if (validate) {
          try {
            const verificationCode = await hashString(10);

            const expiryTime = moment().add(24, "hours").unix();

            const data: any = {
              subject: "Verify Email",
              verificationCode,
              link: `${process.env.URL}/api/v1/verify-email?verificationCode=${verificationCode}&email=${reqParam.email}`,
            };
            await sendEmail(
              reqParam.email,
              CONSTANT.VerifyEmailTemplateId,
              data
            );
            await UserTable.updateOne(
              { _id: user._id },
              {
                $set: {
                  verificationEmailExpireAt: expiryTime,
                  verificationCode,
                },
              }
            );
            return this.Ok(ctx, {
              message:
                "Verification email is sent to you. Please check the email.",
            });
          } catch (e) {
            throw new Error(e.message);
          }
        }
      }
    );
  }

  /**
   *
   * This method is used to verify email of user
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/verify-email", method: HttpMethod.GET })
  public async verifyEmail(ctx: any) {
    const verificationCode: string = ctx.query.verificationCode;
    try {
      const userData = await UserTable.findOne({ verificationCode });
      if (userData) {
        if (userData.verificationEmailExpireAt > moment().unix().toString()) {
          await UserTable.updateOne(
            { _id: userData._id },
            {
              $set: {
                verificationEmailExpireAt: null,
                verificationCode: "",
                email: ctx.query.email,
              },
            }
          );

          await ctx.render("message.pug", {
            message: "Email has been verified successfully",
            type: "Success",
          });
        } else {
          await ctx.render("message.pug", {
            message: "Link has Expired.",
            type: "Error",
          });
        }
      } else {
        await ctx.render("message.pug", {
          message: "Link has Expired.",
          type: "Error",
        });
      }
    } catch (e) {
      throw new Error(e.message);
    }
  }

  /**
   * @description This method is used to change mobile no of user
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/change-cell-no", method: HttpMethod.POST })
  @Auth()
  public changeMobile(ctx: any) {
    const reqParam = ctx.request.body;
    const user = ctx.request.user;
    return validation.changeMobileNumberValidation(
      reqParam,
      ctx,
      async (validate: boolean) => {
        if (validate) {
          const userExists = await UserTable.findOne({ _id: user._id });
          if (!userExists) {
            return this.BadRequest(ctx, "User Not Found");
          }
          const checkCellNumberExists = await UserTable.findOne({
            mobile: reqParam.mobile,
          });
          if (checkCellNumberExists) {
            return this.BadRequest(ctx, "Cell Number Already Exists.");
          }
          if (userExists.type === EUserType.TEEN) {
            const parentMobileExists = await UserTable.findOne({
              parentMobile: reqParam.mobile,
            });
            if (parentMobileExists) {
              return this.BadRequest(
                ctx,
                "Cell Number Already Exists in Parent."
              );
            }
          }
          await TwilioService.sendOTP(reqParam.mobile, EOTPTYPE.CHANGE_MOBILE);
          return this.Ok(ctx, {
            message:
              "We have sent you code in order to proceed your request of changing cell number. Please check your phone.",
          });
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
    return validation.verifyOtpValidation(
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
            { $set: { mobile: reqParam.mobile } }
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
                },
              },
              { new: true }
            );

            let dataSentInCrm: any = {
              Account_Name: updateUser.firstName + " " + updateUser.lastName,
              Email: updateUser.email,
            };

            if (
              updateUser.type == EUserType.PARENT ||
              updateUser.type == EUserType.SELF
            ) {
              dataSentInCrm = {
                ...dataSentInCrm,
                Parent_Signup_Funnel: [
                  ...PARENT_SIGNUP_FUNNEL.SIGNUP,
                  PARENT_SIGNUP_FUNNEL.DOB,
                ],
              };
            } else {
              dataSentInCrm = {
                ...dataSentInCrm,
                Teen_Signup_Funnel: [
                  TEEN_SIGNUP_FUNNEL.SIGNUP,
                  TEEN_SIGNUP_FUNNEL.DOB,
                  TEEN_SIGNUP_FUNNEL.PHONE_NUMBER,
                ],
              };
            }

            await zohoCrmService.addAccounts(
              ctx.request.zohoAccessToken,
              dataSentInCrm
            );
          }

          return this.Ok(ctx, {
            message: "Your mobile number is verified successfully",
          });
        }
      }
    );
  }

  /**
   * @description This method is used to resend otp
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/resend-otp", method: HttpMethod.POST })
  @Auth()
  public resendOtp(ctx: any) {
    const reqParam = ctx.request.body;
    return validation.changeMobileNumberValidation(
      reqParam,
      ctx,
      async (validate) => {
        if (validate) {
          await TwilioService.sendOTP(reqParam.mobile, EOTPTYPE.CHANGE_MOBILE);

          return this.Ok(ctx, {
            message:
              "We have sent you code in order to proceed your request of changing cell number. Please check your phone.",
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
   * @description This method is used to check refferal code
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/check-refferalcode/:code", method: HttpMethod.GET })
  public async checkRefferalCodeInDb(ctx: any) {
    const reqParam = ctx.params;
    if (!reqParam.code) {
      return this.BadRequest(ctx, "Please enter refferal code");
    }
    const refferalCodeExists = await UserTable.findOne({
      referralCode: { $exists: true, $eq: reqParam.code },
    });
    if (refferalCodeExists) {
      return this.Ok(ctx, { message: "Success" });
    }
    return this.BadRequest(ctx, "Refferal Code Doesnt Exists");
  }

  /**
   * @description This method is used to check unique email
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/check-username/:username", method: HttpMethod.GET })
  public async checkUserNameExistsInDb(ctx: any) {
    const reqParam = ctx.params;
    return validation.checkUniqueUserNameValidation(
      reqParam,
      ctx,
      async (validate: boolean) => {
        if (validate) {
          const usernameExists = await UserTable.findOne({
            username: { $regex: `${reqParam.username}$`, $options: "i" },
          });
          if (usernameExists) {
            return this.BadRequest(ctx, "UserName already Exists");
          }
          return this.Ok(ctx, { message: "UserName is available" });
        }
      }
    );
  }

  /**
   * @description This method is used to send reset password request to email and sms
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/reset-password", method: HttpMethod.POST })
  public async resetPassword(ctx: any) {
    const reqParam = ctx.request.body;
    return validation.checkUniqueUserNameValidation(
      reqParam,
      ctx,
      async (validate) => {
        if (validate) {
          const userExists = await UserTable.findOne({
            username: { $regex: `${reqParam.username}$`, $options: "i" },
          });
          if (!userExists) {
            return this.BadRequest(ctx, "User not found");
          }
          const tempPassword = generateTempPassword(userExists.username);
          const message: string = `Your temporary password is ${tempPassword}. Please don't share it with anyone.`;
          const data = {
            message: tempPassword,
            subject: "Reset Password",
          };
          /**
           * send sms for temporary password
           */
          if (userExists.mobile) {
            const twilioResponse: any = await TwilioService.sendSMS(
              userExists.mobile,
              message
            );
            if (twilioResponse.code === 400) {
              return this.BadRequest(
                ctx,
                "Error in sending temporary password"
              );
            }
          }
          /**
           * send email for temporary password
           */
          if (userExists.email) {
            await sendEmail(
              userExists.email,
              CONSTANT.ResetPasswordTemplateId,
              data
            );
          }
          const newPassword = await AuthService.encryptPassword(tempPassword);
          await UserTable.updateOne(
            { _id: userExists._id },
            { $set: { tempPassword: newPassword } }
          );
          return this.Ok(ctx, {
            message: "Please check your email/sms for temporary password.",
          });
        }
      }
    );
  }

  /**
   * @description This method is used to verify temporary password and update new password
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/update-new-password", method: HttpMethod.POST })
  public async updateNewPassword(ctx: any) {
    const reqParam = ctx.request.body;
    return validation.updateNewPasswordValidation(
      reqParam,
      ctx,
      async (validate) => {
        if (validate) {
          const userExists = await UserTable.findOne({
            username: { $regex: reqParam.username, $options: "i" },
          });
          if (!userExists) {
            return this.BadRequest(ctx, "User not found");
          }
          /**
           * check temp password is correct or not
           */
          if (
            !AuthService.comparePassword(
              reqParam.tempPassword,
              userExists.tempPassword
            )
          ) {
            return this.BadRequest(ctx, "Incorrect Temporary Password");
          }
          /**
           *  Update new password
           */
          const newPassword = await AuthService.encryptPassword(
            reqParam.new_password
          );
          await UserTable.updateOne(
            { _id: userExists._id },
            {
              $set: {
                password: newPassword,
                tempPassword: null,
                loginAttempts: 0,
              },
            }
          );
          return this.Ok(ctx, { message: "Password Changed Successfully." });
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
            firstName,
            childFirstName,
            childLastName,
          } = input;
          let query: any = {
            mobile: childMobile,
            parentMobile: mobile,
          };
          let migratedId;
          if (childEmail) {
            query = {
              ...query,
              // parentNumber: { $regex: `${email}$`, $options: "i" },
              email: { $regex: `${childEmail}$`, $options: "i" },
            };
          }

          let user = await UserTable.findOne(query);
          if (user) {
            await UserTable.updateOne(
              {
                _id: user._id,
              },
              {
                $set: {
                  firstName: childFirstName ? childFirstName : user.firstName,
                  lastName: childLastName ? childLastName : user.lastName,
                  mobile: childMobile ? childMobile : user.mobile,
                  parentEmail: email,
                  parentMobile: mobile,
                  type: EUserType.TEEN,
                  isParentFirst: false,
                  isAutoApproval: EAUTOAPPROVAL.ON,
                },
              }
            );
            let parentRecord = await UserTable.findOne({ mobile: mobile });
            let parentInUserDraft = await UserDraftTable.findOne({
              _id: ctx.request.user._id,
            });

            if (!parentRecord && parentInUserDraft) {
              if (
                (parentInUserDraft.type == EUserType.PARENT ||
                  parentInUserDraft.type == EUserType.SELF) &&
                parentInUserDraft
              ) {
                const createObject = {
                  email: parentInUserDraft.email,
                  dob: parentInUserDraft.dob,
                  type: parentInUserDraft.type,
                  mobile: input.mobile,
                  firstName: parentInUserDraft.firstName,
                  lastName: parentInUserDraft.lastName,
                  referralCode: parentInUserDraft.referralCode,
                };
                let userResponse = await UserTable.create(createObject);
                await UserDraftTable.deleteOne({ _id: ctx.request.user._id });
                migratedId = userResponse._id;
              }
            }

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
          const createObject = {
            firstName: childFirstName ? childFirstName : user.firstName,
            lastName: childLastName ? childLastName : user.lastName,
            mobile: childMobile ? childMobile : user.mobile,
            email: childEmail,
            parentEmail: email,
            parentMobile: mobile,
            type: EUserType.TEEN,
            referralCode: uniqueReferralCode,
            isParentFirst: true,
            isAutoApproval: EAUTOAPPROVAL.ON,
          };
          await UserTable.create(createObject);

          let parentRecord = await UserTable.findOne({ mobile: mobile });
          let parentInUserDraft = await UserDraftTable.findOne({
            _id: ctx.request.user._id,
          });

          if (!parentRecord && parentInUserDraft) {
            if (
              (parentInUserDraft.type == EUserType.PARENT ||
                parentInUserDraft.type == EUserType.SELF) &&
              parentInUserDraft
            ) {
              const createObject = {
                email: parentInUserDraft.email,
                dob: parentInUserDraft.dob,
                type: parentInUserDraft.type,
                mobile: input.mobile,
                firstName: parentInUserDraft.firstName,
                lastName: parentInUserDraft.lastName,
                referralCode: parentInUserDraft.referralCode,
              };
              let userResponse = await UserTable.create(createObject);
              await UserDraftTable.deleteOne({ _id: ctx.request.user._id });
              migratedId = userResponse._id;
            }
          }

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
   * @description This method is used for provide states dropdown
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/get-states", method: HttpMethod.GET })
  public async getStates(ctx: any) {
    const states = await StateTable.find({});
    this.Ok(ctx, { data: states });
  }

  /**
   * @description This method is used to create refresh token
   * @param ctx
   * @returns
   */
  @Route({ path: "/refresh-token", method: HttpMethod.POST })
  public async refreshToken(ctx: any) {
    const input = ctx.request.body;
    const { refreshToken } = input;
    if (!refreshToken || refreshToken == "")
      return this.BadRequest(ctx, "Refresh Token not found.");

    let user: any;
    try {
      user = decodeJwtToken(refreshToken);
    } catch (error) {
      return this.UnAuthorized(ctx, "Refresh Token Expired");
    }
    user = await UserTable.findOne({ _id: user._id });
    let token = getJwtToken(await AuthService.getJwtAuthInfo(user));
    return this.Ok(ctx, { token });
  }

  @Route({ path: "/check-email/:mobile", method: HttpMethod.GET })
  public async checkEmailExistsInDB(ctx: any) {
    const reqParam = ctx.params;
    return validation.checkUniqueEmailValidation(
      reqParam,
      ctx,
      async (validate: boolean) => {
        if (validate) {
          const mobileExists = await UserTable.findOne({
            mobile: reqParam.mobile,
          });
          if (mobileExists)
            return this.BadRequest(ctx, "This mobile already exists");
          return this.Ok(ctx, { message: "Mobile is available" });
        }
      }
    );
  }

  /**
   * @description This api is used for remding their parent for sending email for sign up to stack
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/remind-parent", method: HttpMethod.POST })
  @Auth()
  @PrimeTrustJWT(true)
  public async remindParent(ctx: any) {
    const userId = ctx.request.user._id;
    const reqParam = ctx.request.body;
    if (!reqParam.type) {
      return this.BadRequest(ctx, "Please enter type to proceed");
    }
    const user = await UserTable.findOne({ _id: userId });
    if (user.type !== EUserType.TEEN) {
      return this.BadRequest(ctx, "Logged in user is already parent.");
    }
    let parentDetails = null;
    if (reqParam.type == "NO_BANK" || reqParam.type == "NO_RECURRING") {
      parentDetails = await ParentChildTable.findOne({
        "teens.childId": user._id,
      });
      if (!parentDetails) {
        return this.BadRequest(ctx, "Parent account is not registered");
      }

      await DeviceTokenService.sendUserNotification(
        parentDetails.userId,
        reqParam.type == "NO_BANK"
          ? NOTIFICATION_KEYS.NO_BANK_REMINDER
          : NOTIFICATION_KEYS.NO_RECURRING_REMINDER,
        NOTIFICATION.NO_BANK_REMINDER_TITLE,
        reqParam.type == "NO_BANK"
          ? NOTIFICATION.NO_BANK_REMINDER_MESSAGE
          : NOTIFICATION.NO_RECURRING_REMINDER_MESSAGE.replace(
              "#firstName",
              user.firstName
            )
      );

      return this.Ok(ctx, { message: "Success" });
    } else if (reqParam.type == "SEND_REMINDER") {
      const parent = await UserTable.findOne({
        mobile: reqParam.parentMobile,
      });
      if (parent && parent.mobile == user.mobile) {
        return this.BadRequest(
          ctx,
          "Your mobile number and parent's mobile number cannot be same"
        );
      }
      let parentExists = !parent ? false : true;
      await UserTable.updateOne(
        { _id: userId },
        {
          $set: { parentMobile: reqParam.parentMobile },
        }
      );
      if (!parent) {
        parentDetails = await ParentChildTable.findOne({
          "teens.childId": user._id,
        });
        if (parentDetails) {
          await UserTable.updateOne(
            { _id: parentDetails.userId },
            {
              $set: { mobile: reqParam.parentMobile },
            }
          );
        }
      } else {
        let accountId = null;
        let accountNumber = null;
        if (parent.status == EUSERSTATUS.KYC_DOCUMENT_VERIFIED) {
          let parentChildValues = await ParentChildTable.findOne({
            userId: parent._id,
          });
          let childName = user.lastName
            ? user.firstName + " " + user.lastName
            : user.firstName;
          const data = {
            type: "account",
            attributes: {
              "account-type": "custodial",
              name:
                childName +
                " - " +
                parent.firstName +
                " " +
                parent.lastName +
                " - " +
                parentChildValues.contactId,
              "authorized-signature":
                parent.firstName + " - " + parent.lastName,
              "webhook-config": {
                url: envData.WEBHOOK_URL,
              },
              "contact-id": parentChildValues.contactId,
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
        await ParentChildTable.bulkWrite([
          {
            updateOne: {
              filter: { "teens.childId": user._id },
              update: { $pull: { teens: { childId: user._id } } },
            },
          },
          {
            updateOne: {
              filter: { userId: parent._id },
              update: {
                $push: {
                  teens: {
                    childId: user._id,
                    accountId: accountId,
                    accountNumber: accountNumber,
                    pushTransferId: null,
                  },
                },
              },
            },
          },
        ]);
      }
      return this.Ok(ctx, { message: "Reminder sent!", parentExists });
    }
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
    const deviceTokens = await DeviceToken.findOne({ userId: user._id });
    return validation.logoutValidation(
      reqParam,
      ctx,
      async (validate: boolean) => {
        if (validate) {
          if (deviceTokens.deviceToken.includes(reqParam.deviceToken)) {
            await DeviceToken.updateOne(
              { userId: user._id },
              {
                $pull: {
                  deviceToken: reqParam.deviceToken,
                },
              }
            );
          }
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
      if (childAlreadyExists && childInfo) {
        const updateObject = {
          email: childInfo.email,
          dob: childInfo.dob,
          type: childInfo.type,
          mobile: ctx.request.body.mobile,
          firstName: childAlreadyExists.firstName
            ? childAlreadyExists.firstName
            : childInfo.firstName,
          lastName: childAlreadyExists.lastName
            ? childAlreadyExists.lastName
            : childInfo.lastName,
          referralCode: childAlreadyExists.referralCode,
          parentMobile: ctx.request.body.parentMobile,
          parentEmail:
            checkParentExists && checkParentExists.type == EUserType.PARENT
              ? checkParentExists.email
              : null,
        };
        await UserTable.findOneAndUpdate(
          { mobile: ctx.request.body.mobile },
          { $set: updateObject },
          { new: true }
        );

        await UserDraftTable.deleteOne({
          _id: ctx.request.user._id,
        });

        migratedId = childAlreadyExists ? childAlreadyExists._id : "";
      } else {
        const createObject = {
          email: childInfo.email,
          type: childInfo.type,
          dob: childInfo.dob,
          mobile: ctx.request.body.mobile,
          lastName: childInfo.lastName,
          firstName: childInfo.firstName,
          referralCode: childInfo.referralCode,
          parentMobile: ctx.request.body.parentMobile,
          parentEmail:
            checkParentExists && checkParentExists.type == EUserType.PARENT
              ? checkParentExists.email
              : null,
        };

        const userResponse = await UserTable.create(createObject);
        await UserDraftTable.deleteOne({
          _id: ctx.request.user._id,
        });
        migratedId = userResponse._id;
      }
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
            let userExists = await UserTable.findOne({ email });
            let userDraftExists = await UserDraftTable.findOne({ email });
            if (!userExists && !userDraftExists) {
              await SocialService.verifySocial(reqParam);
              const uniqueReferralCode = await makeUniqueReferalCode();
              let createQuery: any = {
                email: reqParam.email,
                firstName: reqParam.firstName ? reqParam.firstName : null,
                lastName: reqParam.lastName ? reqParam.lastName : null,
                referralCode: uniqueReferralCode,
                // mobile: reqParam.mobile ? reqParam.mobile : null,
              };
              const user = await UserDraftTable.create(createQuery);
              if (user) {
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

                let checkUserDraftExists: any = await UserDraftTable.findOne({
                  email,
                });
                const { token, refreshToken } =
                  await TokenService.generateToken(checkUserDraftExists);

                let getProfileInput: any = {
                  request: {
                    query: { token },
                    params: { id: checkUserDraftExists._id },
                  },
                };
                await UserController.getProfile(getProfileInput);

                if (deviceToken) {
                  await DeviceTokenService.addDeviceTokenIfNeeded(
                    checkUserDraftExists._id,
                    deviceToken
                  );
                }

                return this.Ok(ctx, {
                  token,
                  refreshToken,
                  profileData: getProfileInput.body.data,
                  message: "Success",
                  isUserExist: false,
                });
              }
            } else {
              await SocialService.verifySocial(reqParam);

              const { token, refreshToken } = await TokenService.generateToken(
                userExists !== null ? userExists : userDraftExists
              );

              let getProfileInput: any = {
                request: {
                  query: { token },
                  params: {
                    id:
                      userExists !== null
                        ? userExists._id
                        : userDraftExists._id,
                  },
                },
              };
              await UserController.getProfile(getProfileInput);

              if (deviceToken) {
                await DeviceTokenService.addDeviceTokenIfNeeded(
                  userExists !== null ? userExists._id : userDraftExists._id,
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
            }
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
            let userScreenStatusUpdate: any;
            if (
              new Date(
                Date.now() - new Date(reqParam.dob).getTime()
              ).getFullYear() < 1988
            ) {
              userScreenStatusUpdate = await UserDraftTable.findByIdAndUpdate(
                {
                  _id: ctx.request.user._id,
                },
                {
                  $set: {
                    dob: reqParam.dob,
                    type: 1,
                  },
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
                Account_Type:
                  userScreenStatusUpdate.type == EUserType.TEEN ? "Teen" : "",
                Teen_Signup_Funnel: [
                  TEEN_SIGNUP_FUNNEL.SIGNUP,
                  TEEN_SIGNUP_FUNNEL.DOB,
                ],
              };

              await zohoCrmService.addAccounts(
                ctx.request.zohoAccessToken,
                dataSentInCrm
              );
              return this.Ok(ctx, {
                message: "Dob saved",
                userScreenStatusUpdate,
              });
            } else {
              userScreenStatusUpdate = await UserDraftTable.findByIdAndUpdate(
                {
                  _id: ctx.request.user._id,
                },
                {
                  $set: {
                    dob: reqParam.dob,
                  },
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
                Parent_Signup_Funnel: [
                  ...PARENT_SIGNUP_FUNNEL.SIGNUP,
                  PARENT_SIGNUP_FUNNEL.DOB,
                ],
              };
              await zohoCrmService.addAccounts(
                ctx.request.zohoAccessToken,
                dataSentInCrm
              );
              return this.Ok(ctx, {
                message: "Dob saved",
                userScreenStatusUpdate,
              });
            }
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
