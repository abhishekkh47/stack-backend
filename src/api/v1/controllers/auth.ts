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
} from "@app/utility";
import BaseController from "./base";
import {
  ALLOWED_LOGIN_ATTEMPTS,
  EOTPTYPE,
  EOTPVERIFICATION,
  EUserType,
  HttpMethod,
  IUser,
} from "@app/types";
import { AuthService } from "@app/services";
import { Auth } from "@app/middleware";
import { validation } from "@app/validations/apiValidation";
import { UserTable, OtpTable } from "@app/model";
import { TwilioService } from "@app/services";
import moment from "moment";
import { CONSTANT } from "../../../utility/constants";
import { UserWalletTable } from "@app/model/userbalance";

class AliveController extends BaseController {
  @Route({ path: "/login", method: HttpMethod.POST })
  public async handleLogin(ctx: Koa.Context) {
    const reqParam = ctx.request.body;
    return validation.loginValidation(
      reqParam,
      ctx,
      async (validate: boolean) => {
        if (validate) {
          const resetPasswordMessage = `For your protection, we have reset your password due to insufficient login attempts. Check your email/SMS for a temporary password.`;
          const userExists = await UserTable.findOne({
            username: reqParam.username,
          });
          if (!userExists) {
            return this.BadRequest(ctx, "User Not Found");
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
              return this.UnAuthorized(ctx, "Invalid password");
            }
            await UserTable.updateOne(
              { _id: userExists._id },
              { $set: { loginAttempts: 0, tempPassword: null } }
            );
            const authInfo = AuthService.getJwtAuthInfo(userExists);
            const token = getJwtToken(authInfo);
            return this.Ok(ctx, { token });
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
            await this.resetPassword(requestData);
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
          reqParam.email = reqParam.email ? reqParam.email : null;
          let user = await AuthService.findUserByEmail(reqParam.email);
          if (user) {
            return this.UnAuthorized(ctx, "Email Already Exists");
          }
          user = await UserTable.findOne({ mobile: reqParam.mobile });
          if (user) {
            return this.UnAuthorized(ctx, "Mobile Number already Exists");
          }
          /* tslint:disable-next-line */
          if (reqParam.type == EUserType.TEEN) {
            user = await UserTable.findOne({
              email: reqParam.parentEmail,
              type: EUserType.TEEN,
            });
            if (user) {
              return this.UnAuthorized(ctx, "Email Already Exists");
            }
            user = await UserTable.findOne({
              mobile: reqParam.parentMobile,
              type: EUserType.TEEN,
            });
            if (user) {
              return this.UnAuthorized(ctx, "Mobile Number Already Exists");
            }
          }
          user = await UserTable.findOne({ username: reqParam.username });
          if (user) {
            return this.UnAuthorized(ctx, "Username already Exists");
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
            parentEmail: reqParam.parentEmail ? reqParam.parentEmail : null,
            parentMobile: reqParam.parentMobile ? reqParam.parentMobile : null,
          });
          /**
           * Create the balance table
           */
          await UserWalletTable.create({
            userId: user._id,
            balance: 0,
          });
          /**
           * Send sms as of now to parent for invting to stack
           */
          const message: string = `Hello Your teen ${reqParam.username} has invited you to join Stack. Please start the onboarding as soon as possible.`;
          const twilioResponse: any = await TwilioService.sendSMS(
            reqParam.parentMobile,
            message
          );
          if (twilioResponse.code === 400) {
            return this.BadRequest(ctx, "Error in sending OTP");
          }
          const authInfo = AuthService.getJwtAuthInfo(user);
          const token = getJwtToken(authInfo);
          return this.Ok(ctx, {
            token,
            message:
              /* tslint:disable-next-line */
              reqParam.type == EUserType.TEEN
                ? `We have sent sms/email to your parent. Once he starts onboarding process you can have access to full features of this app.`
                : `Your account is created successfully`,
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
      return this.UnAuthorized(ctx, "User not found");
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
          await UserTable.updateOne(
            { _id: user._id },
            { $set: { address: reqParam.address } }
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
    const userData = await UserTable.findOne({ email: reqParam.email });
    if (userData !== null) {
      return this.BadRequest(ctx, "You cannot add same email address");
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
    return validation.changeMobileNumberValidation(
      reqParam,
      ctx,
      async (validate: boolean) => {
        if (validate) {
          const checkCellNumberExists = await UserTable.findOne({
            mobile: reqParam.mobile,
          });
          if (checkCellNumberExists) {
            return this.BadRequest(ctx, "Cell Number Already Exists.");
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
          // console.log(typeof reqParam.code);
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
}

export default new AliveController();
