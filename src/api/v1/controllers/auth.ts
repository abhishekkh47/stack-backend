import Koa from "koa";
import moment from "moment";
import mongoose from "mongoose";
import { child } from "winston";
import envData from "../../../config/index";
import { Auth, PrimeTrustJWT } from "../../../middleware";
import {
  AdminTable,
  CryptoTable,
  DeviceToken,
  Notification,
  OtpTable,
  ParentChildTable,
  QuizResult,
  StateTable,
  UserDraftTable,
  TransactionTable,
  UserReffaralTable,
  UserTable,
} from "../../../model";
import {
  AuthService,
  DeviceTokenService,
  SocialService,
  TokenService,
  TwilioService,
  zohoCrmService,
  quizService,
} from "../../../services";
import {
  EAUTOAPPROVAL,
  EGIFTSTACKCOINSSETTING,
  EOTPTYPE,
  EOTPVERIFICATION,
  ERead,
  ESCREENSTATUS,
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
  sendNotification,
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
import UserController from "./user";

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
            if (!userExists) {
              userExists = await UserTable.findOne({
                email: { $regex: `${email}`, $options: "i" },
              });
              if (!userExists) {
                return this.BadRequest(
                  ctx,
                  "User not found, please signup first."
                );
              }
            }
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
    return validation.signupValidation(
      reqParam,
      ctx,
      async (validate: boolean) => {
        if (validate) {
          let childExists = null;
          let checkParentExists = null;
          let accountId = null;
          let parentId = null;
          let parentTable = null;
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
            if (
              checkParentExists &&
              checkParentExists.status == EUSERSTATUS.KYC_DOCUMENT_VERIFIED &&
              !childExists
            ) {
              parentTable = await ParentChildTable.findOne({
                userId: checkParentExists._id,
              });
              if (!parentTable) {
                return this.BadRequest(ctx, "Account Details Not Found");
              }
              parentId = parentTable._id;
              /**
               * Create Prime Trust Account for other child as well
               * TODO
               */
              let childName = reqParam.lastName
                ? reqParam.firstName + " " + reqParam.lastName
                : reqParam.firstName;
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
                    parentTable.contactId,
                  "authorized-signature":
                    checkParentExists.firstName +
                    " - " +
                    checkParentExists.lastName,
                  "webhook-config": {
                    url: envData.WEBHOOK_URL,
                  },
                  "contact-id": parentTable.contactId,
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
            /**
             * Send sms as of now to parent for invting to stack
             */
            // const message: string = `Hi! Your child, ${reqParam.firstName}, signed up for Stack - a safe and free app designed for teens to learn and earn crypto. 🚀  Register with Stack to unlock their account. ${envData.INVITE_LINK}`;
            // try {
            //   const twilioResponse: any = await TwilioService.sendSMS(
            //     reqParam.parentMobile,
            //     message
            //   );
            //   if (twilioResponse.code === 400) {
            //     return this.BadRequest(ctx, "Error in sending OTP");
            //   }
            // } catch (error) {
            //   return this.BadRequest(ctx, error.message);
            // }
          } else {
            /**
             * Parent flow and self flow
             */
            user = await AuthService.findUserByEmail(reqParam.email);
            const mobile = await UserTable.findOne({ mobile: reqParam.mobile });
            // if (mobile) {
            //   return this.BadRequest(ctx, "Mobile Number already Exists");
            // }
            // if (user && mobile) {
            //   return this.BadRequest(ctx, "Email Already Exists");
            // }
            // user = await UserTable.findOne({
            //   username: { $regex: `${reqParam.email}$`, $options: "i" },
            // });

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
                await childArray.push({ childId: child._id, accountId: null });
              }
            }
          }

          await SocialService.verifySocial(reqParam);

          /**
           * Refferal code present and check whole logic for the
           */

          if (reqParam.refferalCode) {
            refferalCodeExists = await UserTable.findOne({
              referralCode: reqParam.refferalCode,
            });
            if (!refferalCodeExists) {
              return this.BadRequest(ctx, "Refferal Code Not Found");
            }
            if (
              refferalCodeExists.type == EUserType.PARENT &&
              refferalCodeExists.status == EUSERSTATUS.KYC_DOCUMENT_VERIFIED
            ) {
              isGiftedStackCoins = admin.stackCoins;
            } else if (refferalCodeExists.type == EUserType.TEEN) {
              let checkTeenParent = await UserTable.findOne({
                mobile: refferalCodeExists.parentMobile,
              });
              if (
                checkTeenParent &&
                checkTeenParent.status == EUSERSTATUS.KYC_DOCUMENT_VERIFIED
              ) {
                isGiftedStackCoins = admin.stackCoins;
              }
            }
            if (isGiftedStackCoins > 0) {
              await UserTable.updateOne(
                { _id: refferalCodeExists._id },
                {
                  $inc: { preLoadedCoins: isGiftedStackCoins },
                }
              );
              /**
               * Send notification to user who has given refferal code
               */
              let deviceTokenData = await DeviceToken.findOne({
                userId: refferalCodeExists._id,
              }).select("deviceToken");
              if (deviceTokenData) {
                let notificationRequest = {
                  key: NOTIFICATION_KEYS.FREIND_REFER,
                  title: NOTIFICATION.SUCCESS_REFER_MESSAGE,
                  message: null,
                };
                await sendNotification(
                  deviceTokenData.deviceToken,
                  notificationRequest.title,
                  notificationRequest
                );
                await Notification.create({
                  title: notificationRequest.title,
                  userId: refferalCodeExists._id,
                  message: notificationRequest.message,
                  isRead: ERead.UNREAD,
                  data: JSON.stringify(notificationRequest),
                });
              }
              /**
               * Get Quiz Stack Coins
               */
              const checkQuizExists = await quizService.checkQuizExists({
                userId: new mongoose.Types.ObjectId(refferalCodeExists._id),
              });
              let stackCoins = 0;
              if (checkQuizExists.length > 0) {
                stackCoins = checkQuizExists[0].sum;
              }
              stackCoins = stackCoins + isGiftedStackCoins;
              let dataSentInCrm: any = {
                Account_Name:
                  refferalCodeExists.firstName +
                  " " +
                  refferalCodeExists.lastName,
                Stack_Coins: stackCoins,
              };
              await zohoCrmService.addAccounts(
                ctx.request.zohoAccessToken,
                dataSentInCrm
              );
            }
          }
          if (reqParam.type == EUserType.TEEN && childExists) {
            let updateQuery: any = {
              username: null,
              password: null,
              screenStatus: ESCREENSTATUS.SUCCESS_TEEN,
              taxIdNo: reqParam.taxIdNo ? reqParam.taxIdNo : null,
              isParentFirst: false,
            };
            if (reqParam.refferalCode) {
              updateQuery = {
                ...updateQuery,
                preLoadedCoins: {
                  $inc: isGiftedStackCoins > 0 ? isGiftedStackCoins : 0,
                },
              };
            }
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
            const uniqueReferralCode = await makeUniqueReferalCode();
            user = await UserTable.findOneAndUpdate(
              { email: reqParam.email },
              {
                $set: {
                  username: null,
                  password: null,
                  mobile: reqParam.mobile,
                  screenStatus:
                    parseInt(reqParam.type) === EUserType.PARENT ||
                    parseInt(reqParam.type) === EUserType.SELF
                      ? ESCREENSTATUS.UPLOAD_DOCUMENTS
                      : ESCREENSTATUS.SIGN_UP,
                  parentEmail: reqParam.parentEmail
                    ? reqParam.parentEmail
                    : null,
                  parentMobile: reqParam.parentMobile
                    ? reqParam.parentMobile
                    : null,
                  referralCode: uniqueReferralCode,
                  preLoadedCoins:
                    isGiftedStackCoins > 0 ? isGiftedStackCoins : 0,
                  isAutoApproval: EAUTOAPPROVAL.ON,
                },
              },
              { new: true }
            );
          }
          if (reqParam.type == EUserType.PARENT) {
            const parentchild = await ParentChildTable.findOneAndUpdate(
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
                  _id: parentId,
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
                checkParentExists && parentTable
                  ? parentTable.firstChildId
                  : user._id,
              intialDeposit: true,
              type: ETransactionType.DEPOSIT,
            });
            if (checkTransactionExistsAlready) {
              let parentChildTableExists = await ParentChildTable.findOne({
                "teens.childId": user._id,
              });
              const accountIdDetails: any =
                await parentChildTableExists.teens.find(
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
            parentTable &&
            checkParentExists.status == EUSERSTATUS.KYC_DOCUMENT_VERIFIED &&
            parentTable.firstChildId != user._id
          ) {
            /**
             * Added in zoho
             */
            let dataSentInCrm: any = {
              Account_Name: user.firstName + " " + user.lastName,
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

          /**
           * add referral code number as well
           */
          if (refferalCodeExists && isGiftedStackCoins > 0) {
            let dataExists = await UserReffaralTable.findOne({
              userId: refferalCodeExists._id,
            });
            if (!dataExists) {
              await UserReffaralTable.create({
                userId: refferalCodeExists._id,
                referralCount: 1,
                referralArray: [
                  {
                    referredId: user._id,
                    type: 1,
                    coinsGifted: isGiftedStackCoins,
                  },
                ],
              });
            } else {
              await UserReffaralTable.updateOne(
                {
                  userId: refferalCodeExists._id,
                },
                {
                  $set: {
                    referralCount: dataExists.referralCount + 1,
                  },
                  $push: {
                    referralArray: {
                      referredId: user._id,
                      type: 1,
                      coinsGifted: isGiftedStackCoins,
                    },
                  },
                }
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
            if (isGiftedStackCoins > 0) {
              let notificationRequest = {
                key: NOTIFICATION_KEYS.FREIND_REFER,
                title: NOTIFICATION.SUCCESS_REFER_CODE_USE_MESSAGE,
                message: null,
              };
              await sendNotification(
                checkDeviceTokenExists.deviceToken,
                notificationRequest.title,
                notificationRequest
              );
              await Notification.create({
                title: notificationRequest.title,
                userId: user._id,
                message: notificationRequest.message,
                isRead: ERead.UNREAD,
                data: JSON.stringify(notificationRequest),
              });
            }
          }
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
            Mobile: user.mobile,
            Account_Type: user.type == EUserType.PARENT ? "Parent" : "Teen",
            Birthday: user.dob,
            User_ID: user._id,
          };
          if (isGiftedStackCoins > 0) {
            dataSentInCrm = {
              ...dataSentInCrm,
              Stack_Coins: isGiftedStackCoins,
            };
          }
          if (user.type == EUserType.PARENT) {
            dataSentInCrm = {
              ...dataSentInCrm,
              Parent_Signup_Funnel: [
                ...PARENT_SIGNUP_FUNNEL.SIGNUP,
                PARENT_SIGNUP_FUNNEL.DOB,
                PARENT_SIGNUP_FUNNEL.CONFIRM_DETAILS,
                PARENT_SIGNUP_FUNNEL.CHILD_INFO,
              ],
              Parent_Number: reqParam.mobile,
              Teen_Number: reqParam.childMobile,
              Teen_Name: reqParam.childLastName
                ? reqParam.childFirstName + " " + reqParam.childLastName
                : reqParam.childFirstName,
            };
          }
          if (user.type == EUserType.TEEN) {
            dataSentInCrm = {
              ...dataSentInCrm,
              Parent_Number: reqParam.parentMobile,
              Teen_Number: reqParam.mobile,
              Teen_Name: reqParam.lastName
                ? reqParam.firstName + " " + reqParam.lastName
                : reqParam.firstName,
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
  @Route({ path: "/check-user-signup", method: HttpMethod.POST })
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
              return this.BadRequest(ctx, "Email Doesn't Exists");
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
  public verifyOtpSignUp(ctx: any) {
    const reqParam = ctx.request.body;
    return validation.verifyOtpValidation(
      reqParam,
      ctx,
      async (validate: boolean) => {
        if (validate) {
          let migratedId;
          let childAlready;
          const otpExists = await OtpTable.findOne({
            receiverMobile: reqParam.mobile,
          }).sort({ createdAt: -1 });
          if (!otpExists) {
            return this.BadRequest(ctx, "Mobile Number Not Found");
          }
          if (otpExists.isVerified === EOTPVERIFICATION.VERIFIED) {
            childAlready = await UserTable.findOne({
              mobile: reqParam.mobile,
            });
            const childInfo = await UserDraftTable.findOne({
              _id: reqParam._id,
            });
            if (childAlready && childInfo) {
              const updateObject = {
                email: childInfo.email,
                dob: childInfo.dob,
                type: childInfo.type,
                mobile: reqParam.mobile,
                screenStatus: ESCREENSTATUS.ENTER_PARENT_INFO,
                firstName: childAlready.firstName
                  ? childAlready.firstName
                  : childInfo.firstName,
                lastName: childAlready.lastName
                  ? childAlready.lastName
                  : childInfo.lastName,
              };
              await UserTable.findOneAndUpdate(
                { mobile: reqParam.mobile },
                { $set: updateObject },
                { new: true }
              );
              await UserDraftTable.findOneAndUpdate(
                {
                  _id: reqParam._id,
                },
                { $set: { screenStatus: ESCREENSTATUS.ENTER_PARENT_INFO } },
                { new: true }
              );
              migratedId = childAlready ? childAlready._id : "";
            } else {
              const createObject = {
                email: childInfo.email,
                type: childInfo.type,
                dob: childInfo.dob,
                mobile: reqParam.mobile,
                screenStatus: ESCREENSTATUS.ENTER_PARENT_INFO,
                lastName: childInfo.lastName,
                firstName: childInfo.firstName,
              };

              const userResponse = await UserTable.create(createObject);
              migratedId = userResponse._id;
              await UserDraftTable.findOneAndUpdate(
                {
                  _id: reqParam._id,
                },
                { $set: { screenStatus: ESCREENSTATUS.ENTER_PARENT_INFO } },
                { new: true }
              );
            }

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
            childAlready = await UserTable.findOne({
              mobile: reqParam.mobile,
            });
            const childInfo = await UserDraftTable.findOne({
              _id: reqParam._id,
            });
            if (childAlready && childInfo) {
              const updateObject = {
                email: childInfo.email,
                dob: childInfo.dob,
                type: childInfo.type,
                mobile: reqParam.mobile,
                screenStatus: ESCREENSTATUS.ENTER_PARENT_INFO,
                firstName: childAlready.firstName
                  ? childAlready.firstName
                  : childInfo.firstName,
                lastName: childAlready.lastName
                  ? childAlready.lastName
                  : childInfo.lastName,
              };
              await UserDraftTable.findOneAndUpdate(
                {
                  _id: reqParam._id,
                },
                { $set: { screenStatus: ESCREENSTATUS.ENTER_PARENT_INFO } },
                { new: true }
              );

              await UserTable.findOneAndUpdate(
                { mobile: reqParam.mobile },
                { $set: updateObject },
                { new: true }
              );
              migratedId = childAlready ? childAlready._id : "";
            } else {
              const createObject = {
                email: childInfo.email,
                type: childInfo.type,
                dob: childInfo.dob,
                mobile: reqParam.mobile,
                screenStatus: ESCREENSTATUS.ENTER_PARENT_INFO,
                lastName: childInfo.lastName,
                firstName: childInfo.firstName,
              };

              const userResponse: any = await UserTable.create(createObject);

              migratedId = userResponse._id;

              await UserDraftTable.findOneAndUpdate(
                {
                  _id: reqParam._id,
                },
                { $set: { screenStatus: ESCREENSTATUS.ENTER_PARENT_INFO } },
                { new: true }
              );
            }
          }
          return this.Ok(ctx, {
            message: "Your mobile number is verified successfully",
            migratedId,
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
          // let user = await UserTable.findOne({ mobile });
          // if (user)
          //   return this.BadRequest(ctx, "Mobile number already exists.");
          // user = await UserTable.findOne({
          //   email: { $regex: `${email}$`, $options: "i" },
          // });
          // if (user) return this.BadRequest(ctx, "Email-ID already exists.");

          /**
           * Send sms for confirmation of otp
           */

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
    return validation.checkValidMobileValidation(
      input,
      ctx,
      async (validate) => {
        if (validate) {
          const { mobile, type } = input;
          let migratedId;

          if (type == EUserType.TEEN) {
            let userExists = await UserTable.findOne({
              $or: [{ mobile: mobile }, { parentMobile: mobile }],
            });
            if (userExists) {
              if (userExists.isParentFirst == true) {
                return this.Ok(ctx, { message: "Success" });
              }

              //if 2 entries then dont say mobile no. exists
              if (userExists && !userExists.email === null) {
                return this.BadRequest(ctx, "Mobile Number Already Exists");
              }
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
          const draftUser = await UserDraftTable.findOne({
            _id: ctx.request.user._id,
          });
          if (type == EUserType.PARENT && draftUser) {
            const createObject = {
              email: draftUser.email,
              dob: draftUser.dob,
              type: draftUser.type,
              mobile: input.mobile,
              firstName: input.firstName
                ? input.firstName
                : draftUser.firstName,
              lastName: input.lastName ? input.lastName : draftUser.lastName,
              country: input.country,
              state: input.state,
              city: input.city,
              address: input.address,
              unitApt: input.unitApt,
              postalCode: input.postalCode,
              screenStatus: ESCREENSTATUS.CHILD_INFO_SCREEN,
              taxIdNo: input.taxIdNo,
            };
            let userResponse = await UserTable.create(createObject);
            migratedId = userResponse._id;
          }
          if (type == EUserType.SELF && draftUser) {
            const createObject = {
              email: draftUser.email,
              dob: draftUser.dob,
              type: draftUser.type,
              mobile: input.mobile,
              firstName: input.firstName
                ? input.firstName
                : draftUser.firstName,
              lastName: input.lastName ? input.lastName : draftUser.lastName,
              country: input.country,
              state: input.state,
              city: input.city,
              address: input.address,
              unitApt: input.unitApt,
              postalCode: input.postalCode,
              screenStatus: ESCREENSTATUS.ENTER_PARENT_INFO,
              taxIdNo: input.taxIdNo,
            };
            let userResponse = await UserTable.create(createObject);

            migratedId = userResponse._id;
          }
          if (type == EUserType.SELF || type == EUserType.PARENT) {
            return this.Ok(ctx, { message: "Success", migratedId });
          } else {
            return this.Ok(ctx, { message: "Success" });
          }
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
          if (childEmail) {
            query = {
              ...query,
              // parentNumber: { $regex: `${email}$`, $options: "i" },
              email: { $regex: `${childEmail}$`, $options: "i" },
            };
          }
          let user = await UserDraftTable.findOne(query);
          if (user) {
            await UserDraftTable.updateOne(
              {
                mobile: childMobile,
              },
              {
                $set: {
                  firstName: childFirstName,
                  lastName: childLastName,
                },
              }
            );
            const createObject = {
              firstName: childFirstName ? childFirstName : user.firstName,
              lastName: childLastName ? childLastName : user.lastName,
              mobile: childMobile ? childMobile : user.phoneNumber,
              parentEmail: email,
              parentMobile: mobile,
              type: EUserType.TEEN,
              screenStatus: ESCREENSTATUS.SUCCESS_TEEN,
              // referralCode: uniqueReferralCode,
              isParentFirst: true,
              isAutoApproval: EAUTOAPPROVAL.ON,
            };
            await UserTable.create(createObject);
            return this.Ok(ctx, {
              message: "Account successfully linked!",
              isAccountFound: true,
            });
          }
          /**
           * This validation is there to keep if any child sign up with parent email or mobile
           */
          if (childEmail) {
            let checkEmailExists = await UserDraftTable.findOne({
              email: childEmail,
            });
            if (checkEmailExists) {
              return this.BadRequest(ctx, "Child Email Already Exists");
            }
          }
          let checkMobileExists = await UserDraftTable.findOne({
            mobile: childMobile,
          });
          if (checkMobileExists) {
            return this.BadRequest(ctx, "Child Mobile Already Exists");
          }
          // let checkParentMobileExists = await UserTable.findOne({
          //   mobile: childMobile,
          // });
          // if (checkParentMobileExists) {
          //   return this.BadRequest(ctx, "Parent Mobile Already Exists");
          // }
          /**
           * send twilio message to the teen in order to signup.
           */
          // const message: string = `Hi there! Your ${firstName} has signed you up for Stack - an easy and fun app designed for teens to earn and trade crypto. 🚀  Create your own account to get started. ${envData.INVITE_LINK}`;
          // try {
          //   const twilioResponse: any = await TwilioService.sendSMS(
          //     childMobile,
          //     message
          //   );
          //   if (twilioResponse.code === 400) {
          //     return this.BadRequest(ctx, "Error in sending OTP");
          //   }
          // } catch (error) {
          //   return this.BadRequest(ctx, error.message);
          // }
          if (!childFirstName) {
            return this.Ok(ctx, {
              message: "You are inviting your teen in stack",
            });
          }
          /**
           * Create child account based on parent's input
           */
          /**
           * Generate referal code when user sign's up.
           */
          const uniqueReferralCode = await makeUniqueReferalCode();
          const createObject = {
            firstName: childFirstName ? childFirstName : user.firstName,
            lastName: childLastName ? childLastName : user.lastName,
            mobile: childMobile ? childMobile : user.phoneNumber,
            parentEmail: email,
            parentMobile: mobile,
            type: EUserType.TEEN,
            screenStatus: ESCREENSTATUS.SUCCESS_TEEN,
            referralCode: uniqueReferralCode,
            isParentFirst: true,
            isAutoApproval: EAUTOAPPROVAL.ON,
          };
          await UserTable.create(createObject);
          return this.Ok(ctx, {
            message: "Invite sent!",
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
      let deviceTokenData = await DeviceToken.findOne({
        userId: parentDetails.userId,
      }).select("deviceToken");
      if (deviceTokenData) {
        let notificationRequest = {
          key:
            reqParam.type == "NO_BANK"
              ? NOTIFICATION_KEYS.NO_BANK_REMINDER
              : NOTIFICATION_KEYS.NO_RECURRING_REMINDER,
          title: NOTIFICATION.NO_BANK_REMINDER_TITLE,
          message:
            reqParam.type == "NO_BANK"
              ? NOTIFICATION.NO_BANK_REMINDER_MESSAGE
              : NOTIFICATION.NO_RECURRING_REMINDER_MESSAGE.replace(
                  "#firstName",
                  user.firstName
                ),
        };
        await sendNotification(
          deviceTokenData.deviceToken,
          notificationRequest.title,
          notificationRequest
        );
        await Notification.create({
          title: notificationRequest.title,
          userId: parentDetails.userId,
          message: notificationRequest.message,
          isRead: ERead.UNREAD,
          data: JSON.stringify(notificationRequest),
        });
      }
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
      /**
       * send twilio message to the teen in order to signup.
       */
      // const message: string = `Hi! Your child, ${user.firstName}, signed up for Stack - a safe and free app designed for teens to learn and earn crypto. 🚀  Register with Stack to unlock their account. ${envData.INVITE_LINK}`;
      // try {
      //   const twilioResponse: any = await TwilioService.sendSMS(
      //     reqParam.parentMobile,
      //     message
      //   );
      //   if (twilioResponse.code === 400) {
      //     return this.BadRequest(ctx, "Error in sending message");
      //   }
      // } catch (error) {
      //   return this.BadRequest(ctx, error.message);
      // }
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
            return this.Ok(ctx, { message: "Logout Successfully" });
          } else {
            return this.BadRequest(ctx, "Device Token Doesn't Match");
          }
        }
      }
    );
  }

  /**
   * @description This api is used for checking parent exists or not in database
   * @returns {*}
   */
  @Route({ path: "/check-parent-exists", method: HttpMethod.POST })
  public async checkParentExists(ctx: any) {
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
      return this.BadRequest(
        ctx,
        "Looks like this phone number is associated with a child account. Please try a different phone number"
      );
    }

    if (ctx.request.body.parentMobile && !checkParentExists) {
      await UserTable.updateOne(
        { mobile: ctx.request.body.mobile },
        {
          $set: {
            screenStatus: ESCREENSTATUS.SUCCESS_TEEN,
            parentMobile: ctx.request.body.parentMobile,
          },
        }
      );
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
  @Route({ path: "/check-signup", method: HttpMethod.POST })
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
              let createQuery: any = {
                email: reqParam.email,
                screenStatus: ESCREENSTATUS.DOB_SCREEN,
                firstName: reqParam.firstName ? reqParam.firstName : null,
                lastName: reqParam.lastName ? reqParam.lastName : null,
                // mobile: reqParam.mobile ? reqParam.mobile : null,
              };
              const user = await UserDraftTable.create(createQuery);
              if (user) {
                /**
                 * Zoho crm account addition
                 */
                let dataSentInCrm: any = {
                  Account_Name: reqParam.firstName + " " + reqParam.firstName,
                  First_Name: reqParam.firstName,
                  Last_Name: reqParam.firstName ? reqParam.firstName : null,
                  Email: reqParam.email,
                  User_ID: user._id,
                }
                console.log('dataSentInCrm: ', dataSentInCrm);

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

                await DeviceTokenService.addDeviceTokenIfNeeded(
                  checkUserDraftExists._id,
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
                    screenStatus: ESCREENSTATUS.ENTER_PHONE_NO,
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
              Account_Name: userScreenStatusUpdate.firstName + " " + userScreenStatusUpdate.firstName,
              Birthday: userScreenStatusUpdate.dob,
              Account_Type: userScreenStatusUpdate.type == EUserType.TEEN ? "Teen" : "",
             }

             await zohoCrmService.addAccounts(
              ctx.request.zohoAccessToken,
              dataSentInCrm
            );
            console.log('dataSentInCrm: ', dataSentInCrm);
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
                    screenStatus: ESCREENSTATUS.MYSELF_PARENT_SCREEN,
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
                  userScreenStatusUpdate.firstName,
                Birthday: userScreenStatusUpdate.dob,
              };
              console.log("dataSentInCrm: ", dataSentInCrm);
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
                    screenStatus: ESCREENSTATUS.DETAIL_SCREEN,
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
                  userTypeScreenUpdate.firstName,
                Account_Type:
                  reqParam.type == EUserType.PARENT ? "Parent" : "Self",
              };
              console.log("dataSentInCrm: ", dataSentInCrm);
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
