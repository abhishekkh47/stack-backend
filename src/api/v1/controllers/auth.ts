import Koa from "koa";

import {
  generateRandom6DigitCode,
  getJwtToken,
  Route,
  getMinutesBetweenDates,
  verifyToken,
  sendEmail,
  hashString,
  generateTempPassword,
  getRefreshToken,
} from "../../../utility";
import BaseController from "./base";
import {
  ALLOWED_LOGIN_ATTEMPTS,
  EOTPTYPE,
  EOTPVERIFICATION,
  ESCREENSTATUS,
  EUserType,
  HttpMethod,
  IUser,
} from "../../../types";
import { AuthService } from "../../../services";
import { Auth } from "../../../middleware";
import { validation } from "../../../validations/apiValidation";
import {
  UserTable,
  OtpTable,
  ParentChildTable,
  StateTable,
  DeviceToken,
} from "../../../model";
import { TwilioService } from "../../../services";
import moment from "moment";
import { CONSTANT } from "../../../utility/constants";
import { UserWalletTable } from "../../../model/userbalance";
import { ObjectId } from "mongodb";
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
          const { username } = reqParam;
          if (!username) {
            return this.BadRequest(
              ctx,
              "Please enter either username or email"
            );
          }
          const resetPasswordMessage = `For your protection, we have reset your password due to insufficient login attempts. Check your email/SMS for a temporary password.`;
          let userExists = await UserTable.findOne({
            username,
          });
          if (!userExists) {
            userExists = await UserTable.findOne({
              email: username,
            });
            if (!userExists) {
              return this.BadRequest(ctx, "User Not Found");
            }
          }
          /**
           * Less than 3 attempts
           */
          if (userExists.loginAttempts < ALLOWED_LOGIN_ATTEMPTS - 1) {
            /**
             * Compare Password
             */
            if (
              !AuthService.comparePassword(
                ctx.request.body.password,
                userExists.password
              )
            ) {
              if (userExists.loginAttempts < ALLOWED_LOGIN_ATTEMPTS - 1) {
                userExists.loginAttempts = userExists.loginAttempts + 1;
                await userExists.save();
              }
              return this.BadRequest(ctx, "Invalid password");
            }
            await UserTable.updateOne(
              { _id: userExists._id },
              { $set: { loginAttempts: 0, tempPassword: null } }
            );
            const authInfo = AuthService.getJwtAuthInfo(userExists);
            const token = getJwtToken(authInfo);
            const refreshToken = getRefreshToken(authInfo);
            userExists.refreshToken = refreshToken;
            await userExists.save();

            let getProfileInput: any = {
              request: {
                query: { token },
                headers: {},
                params: { id: userExists._id },
              },
            };
            await UserController.getProfile(getProfileInput);
            if (reqParam.deviceToken) {
              const checkDeviceTokenExists = await DeviceToken.findOne({
                userId: userExists._id,
              });
              if (!checkDeviceTokenExists) {
                await DeviceToken.create({
                  userId: userExists._id,
                  "deviceToken.0": reqParam.deviceToken,
                });
              } else {
                if (
                  !checkDeviceTokenExists.deviceToken.includes(
                    reqParam.deviceToken
                  )
                ) {
                  await DeviceToken.updateOne(
                    { _id: checkDeviceTokenExists._id },
                    {
                      $push: {
                        deviceToken: reqParam.deviceToken,
                      },
                    }
                  );
                }
              }
            }
            return this.Ok(ctx, {
              token,
              refreshToken,
              profileData: getProfileInput.body.data,
            });
          } else {
            /**
             * RESET PASSWORD API CALL
             */
            userExists.loginAttempts = userExists.loginAttempts + 1;
            await userExists.save();
            const requestData = {
              request: {
                body: {
                  username: userExists.username,
                },
              },
            };
            // await this.resetPassword(requestData);
            return this.BadRequest(ctx, resetPasswordMessage);
          }
        }
      }
    );
  }

  @Route({ path: "/signup", method: HttpMethod.POST })
  public async handleSignup(ctx: Koa.Context) {
    const reqParam = ctx.request.body;
    return validation.signupValidation(
      reqParam,
      ctx,
      async (validate: boolean) => {
        if (validate) {
          let childExists = null;
          const childArray = [];
          let user = await AuthService.findUserByEmail(reqParam.email);
          if (user) {
            return this.BadRequest(ctx, "Email Already Exists");
          }
          user = await UserTable.findOne({ username: reqParam.email });
          if (user) {
            return this.BadRequest(
              ctx,
              "This email is used by some other user as username"
            );
          }
          user = await UserTable.findOne({ mobile: reqParam.mobile });
          if (user) {
            return this.BadRequest(ctx, "Mobile Number already Exists");
          }
          /* tslint:disable-next-line */
          if (reqParam.type == EUserType.TEEN) {
            user = await UserTable.findOne({
              email: reqParam.parentEmail,
              type: EUserType.TEEN,
            });
            if (user) {
              return this.BadRequest(ctx, "Email Already Exists");
            }
            user = await UserTable.findOne({
              mobile: reqParam.parentMobile,
              type: EUserType.TEEN,
            });
            if (user) {
              return this.BadRequest(ctx, "Mobile Number Already Exists");
            }
            user = await UserTable.findOne({ parentEmail: reqParam.username });
            if (user) {
              return this.BadRequest(
                ctx,
                "This username is used by some other user as parent's email"
              );
            }
            user = await UserTable.findOne({ username: reqParam.parentEmail });
            if (user) {
              return this.BadRequest(
                ctx,
                "This parent email is used by some other user as username"
              );
            }
            /**
             * Send sms as of now to parent for invting to stack
             */
            const message: string = `Hello Your teen ${reqParam.username} has invited you to join Stack. Please start the onboarding as soon as possible.`;
            try {
              const twilioResponse: any = await TwilioService.sendSMS(
                reqParam.parentMobile,
                message
              );
              if (twilioResponse.code === 400) {
                return this.BadRequest(ctx, "Error in sending OTP");
              }
            } catch (error) {
              return this.BadRequest(ctx, error.message);
            }
          } else {
            /**
             * Parent flow
             */
            const parentEmailExistInChild = await UserTable.findOne({
              parentEmail: reqParam.email,
            });
            const parentMobileExistInChild = await UserTable.findOne({
              parentMobile: reqParam.mobile,
            });
            if (!parentEmailExistInChild || !parentMobileExistInChild) {
              return this.BadRequest(
                ctx,
                "Sorry , We cannot find this email/mobile in teen."
              );
            }
            childExists = await UserTable.findOne({
              mobile: reqParam.childMobile,
            });
            if (!childExists) {
              return this.BadRequest(ctx, "Teen Mobile Number Doesn't Exists");
            }
            if (
              childExists.parentMobile !== reqParam.mobile ||
              childExists.parentEmail !== reqParam.email
            ) {
              return this.BadRequest(
                ctx,
                "Sorry We cannot find your accounts. Unable to link them"
              );
            }
            // if (reqParam.fileTaxesInUS == 0 || reqParam.citizenOfUS == 0) {
            //   return this.BadRequest(
            //     ctx,
            //     "Sorry We are only serving US Based Citizens right now but we do plan to expand. Stay Tuned!!"
            //   );
            // }
            if (
              reqParam.type == EUserType.PARENT &&
              new Date(
                Date.now() - new Date(reqParam.dob).getTime()
              ).getFullYear() < 1988
            ) {
              return this.BadRequest(ctx, "Parent's age should be 18+");
            }

            const childDetails = await UserTable.find(
              {
                type: EUserType.TEEN,
                parentEmail: reqParam.email,
                parentMobile: reqParam.mobile,
              },
              {
                _id: 1,
              }
            );
            if (childDetails.length == 0) {
              return this.BadRequest(ctx, "Teen Mobile Number Doesn't Exists");
            }
            for await (const child of childDetails) {
              await childArray.push({ childId: child._id, accountId: null });
            }
          }
          if (reqParam.username) {
            user = await UserTable.findOne({ username: reqParam.username });
            if (user) {
              return this.BadRequest(ctx, "Username already Exists");
            }
            user = await UserTable.findOne({ email: reqParam.username });
            if (user) {
              return this.BadRequest(
                ctx,
                "This username is used by some other user as email"
              );
            }
          }
          reqParam.password = AuthService.encryptPassword(reqParam.password);
          user = await UserTable.create({
            username: reqParam.username,
            password: reqParam.password,
            email: reqParam.email ? reqParam.email : null,
            type: reqParam.type,
            firstName: reqParam.firstName,
            lastName: reqParam.lastName,
            mobile: reqParam.mobile,
            screenStatus:
              reqParam.type === EUserType.PARENT
                ? ESCREENSTATUS.CHANGE_ADDRESS
                : ESCREENSTATUS.SIGN_UP,
            parentEmail: reqParam.parentEmail ? reqParam.parentEmail : null,
            parentMobile: reqParam.parentMobile ? reqParam.parentMobile : null,
            dob: reqParam.dob ? reqParam.dob : null,
            taxIdNo: reqParam.taxIdNo ? reqParam.taxIdNo : null,
          });
          if (user.type === EUserType.PARENT) {
            await ParentChildTable.create({
              userId: user._id,
              contactId: null,
              firstChildId: childExists._id,
              teens: childArray,
            });
          }

          const authInfo = AuthService.getJwtAuthInfo(user);
          const refreshToken = getRefreshToken(authInfo);
          user.refreshToken = refreshToken;
          await user.save();
          const token = getJwtToken(authInfo);
          let getProfileInput: any = {
            request: {
              query: { token },
              headers: {},
              params: { id: user._id },
            },
          };
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
          const code = generateRandom6DigitCode(true);
          const message: string = `Your verification code is ${code}. Please don't share it with anyone.`;
          /**
           * Send Otp to User from registered mobile number
           */
          const twilioResponse: any = await TwilioService.sendSMS(
            reqParam.mobile,
            message
          );
          if (twilioResponse.code === 400) {
            return this.BadRequest(ctx, "Error in sending OTP");
          }
          await OtpTable.create({
            message,
            code,
            receiverMobile: reqParam.mobile,
            type: EOTPTYPE.CHANGE_MOBILE,
          });
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
          await OtpTable.updateOne(
            { _id: otpExists._id },
            { $set: { isVerified: EOTPVERIFICATION.VERIFIED } }
          );
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
          const code = generateRandom6DigitCode(true);
          const message: string = `Your verification code is ${code}. Please don't share it with anyone.`;
          /**
           * Send Otp to User from registered mobile number
           */
          try {
            const twilioResponse: any = await TwilioService.sendSMS(
              reqParam.mobile,
              message
            );
            if (twilioResponse.code === 400) {
              return this.BadRequest(ctx, "Error in sending OTP");
            }
          } catch (error) {
            return this.BadRequest(ctx, error);
          }
          await OtpTable.create({
            message,
            code,
            receiverMobile: reqParam.mobile,
            type: EOTPTYPE.CHANGE_MOBILE,
          });
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
          const { mobile, email } = input;
          let user = await UserTable.findOne({ mobile });
          if (user)
            return this.BadRequest(ctx, "Mobile number already exists.");
          user = await UserTable.findOne({ email });
          if (user) return this.BadRequest(ctx, "Email-ID already exists.");

          /**
           * Send sms for confirmation of otp
           */
          const code = generateRandom6DigitCode(true);
          const message: string = `Your verification code is ${code}. Please don't share it with anyone.`;
          try {
            const twilioResponse: any = await TwilioService.sendSMS(
              mobile,
              message
            );
            if (twilioResponse.code === 400) {
              return this.BadRequest(ctx, "Error in sending OTP");
            }
            await OtpTable.create({
              message,
              code,
              receiverMobile: mobile,
              type: EOTPTYPE.SIGN_UP,
            });
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
            username: reqParam.username,
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
            username: reqParam.username,
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
            username: reqParam.username,
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
          const { mobile, childMobile, email, childEmail } = input;
          let user = await UserTable.findOne({
            mobile: childMobile,
            parentMobile: mobile,
            email: childEmail,
            parentEmail: email,
          });
          if (user) return this.Ok(ctx, { message: "Success" });
          return this.BadRequest(ctx, "We cannot find your accounts");
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
   * @description This method is used to store address and asset information
   * @param ctx
   * @returns
   */
  @Route({ path: "/store-user-details", method: HttpMethod.POST })
  @Auth()
  public async storeUserDetails(ctx: any) {
    let input: any = ctx.request.body;
    const userExists = await UserTable.findOne({ _id: ctx.request.user._id });
    if (!userExists) {
      return this.BadRequest(ctx, "User Not Found");
    }
    return validation.storeUserDetailsValidation(
      input,
      ctx,
      async (validate) => {
        if (validate) {
          const state = await StateTable.findOne({ _id: input.stateId });
          if (!state) return this.BadRequest(ctx, "Invalid State ID.");
          try {
            input.screenStatus =
              userExists.type === EUserType.PARENT
                ? ESCREENSTATUS.UPLOAD_DOCUMENTS
                : ESCREENSTATUS.SIGN_UP;
            await UserTable.findOneAndUpdate(
              { username: ctx.request.user.username },
              { $set: input }
            );
            return this.Created(ctx, {
              message:
                "Stored Address and Liquid Asset Information Successfully",
            });
          } catch (error) {
            this.BadRequest(ctx, "Something went wrong. Please try again.");
          }
        }
      }
    );
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
      user = verifyToken(refreshToken);
    } catch (error) {
      return this.UnAuthorized(ctx, "Refresh Token Expired");
    }
    let token = getJwtToken(AuthService.getJwtAuthInfo(user));
    return this.Ok(ctx, { token });
  }

  @Route({ path: "/check-email/:email", method: HttpMethod.GET })
  public async checkEmailExistsInDB(ctx: any) {
    const reqParam = ctx.params;
    return validation.checkUniqueEmailValidation(
      reqParam,
      ctx,
      async (validate: boolean) => {
        if (validate) {
          const emailExists = await UserTable.findOne({
            email: reqParam.email,
          });
          if (emailExists)
            return this.BadRequest(ctx, "This email already exists");
          return this.Ok(ctx, { message: "Email-ID is available" });
        }
      }
    );
  }

  /**
   * @description This api is used for remding their parent for sending email for sign up to stack
   * @param ctx
   * @returns
   */
  @Route({ path: "/remind-parent", method: HttpMethod.POST })
  @Auth()
  public async remindParent(ctx: any) {
    const userId = ctx.request.user._id;
    const user = await UserTable.findOne({ _id: userId });
    if (user.type !== EUserType.TEEN)
      return this.BadRequest(ctx, "Logged in user is already parent.");
    const parent = await UserTable.findOne({ email: user.parentEmail });
    if (parent) return this.BadRequest(ctx, "Parent Already Sign Up");
    sendEmail(user.parentEmail, CONSTANT.RemindParentTemplateId, {
      subject: "Remind to Signup",
      name: `${user.firstName} ${user.lastName}`,
    });
    return this.Ok(ctx, { message: "Reminder Email is sent to your parent. " });
  }
}

export default new AuthController();
