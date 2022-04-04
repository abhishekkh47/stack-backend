import Koa from "koa";

import {getJwtToken, Route, verifyToken, sendEmail, hashString} from "@app/utility";
import BaseController from "./base";
import { HttpMethod, IUser } from "@app/types";
import { AuthService } from "@app/services";
import { Auth } from "@app/middleware";
import { validation } from "@app/validations/apiValidation";
import { UserTable } from "@app/model";
import moment from "moment";
import {CONSTANT} from "../../../utility/constants";

class AliveController extends BaseController {
  @Route({ path: "/login", method: HttpMethod.POST })
  public async handleLogin(ctx: Koa.Context) {
    const user = await AuthService.findUserByEmail(ctx.request.body.email);
    if (!user) {
      return this.UnAuthorized(ctx, "User not found");
    }
    if (
      !AuthService.comparePassword(ctx.request.body.password, user.password)
    ) {
      return this.UnAuthorized(ctx, "Invalid password");
    }
    const authInfo = AuthService.getJwtAuthInfo(user);
    const token = getJwtToken(authInfo);
    return this.Ok(ctx, { token });
  }

  @Route({ path: "/signup", method: HttpMethod.POST })
  public async handleSignup(ctx: Koa.Context) {
    const isUserExists = await AuthService.findUserByEmail(
      ctx.request.body.email
    );
    if (isUserExists) {
      return this.UnAuthorized(ctx, "User already exists");
    }
    const user = await AuthService.signupUser(ctx.request.body);

    const authInfo = AuthService.getJwtAuthInfo(user);
    const token = getJwtToken(authInfo);

    return this.Ok(ctx, { token });
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
  @Route({path: "/change-email", method: HttpMethod.POST})
  @Auth()
  public async changeEmail(ctx: any) {
    const user = ctx.request.user;
    const reqParam = ctx.request.body;
    const userData = await UserTable.findOne({email: reqParam.email})
    if (userData !== null) {
      return this.BadRequest(ctx, "same email address");
    }
    return validation.changeEmailValidation(
        reqParam,
        ctx,
        async (validate: boolean) => {
          if (validate) {
            try {
              const verificationCode = await hashString(10)

              const expiryTime = moment().add(24, 'hours').unix()

              const data: any = {
                subject: 'Verify Email',
                verificationCode,
                link: `${process.env.URL}/api/v1/verify-email?verificationCode=${verificationCode}&email=${reqParam.email}`
              }
              await sendEmail(reqParam.email, CONSTANT.VerifyEmailTemplateId, data)
              await UserTable.updateOne(
                  {_id: user._id},
                  {$set: {verificationEmailExpireAt: expiryTime, verificationCode}}
              )
              return this.Ok(ctx, {message: "a verification email has been sent to your email address. please verify to change email."});
            } catch (e) {
              throw new Error(e.message);
            }
          }
        }
    );
  }

  /**
   * This method is used to verify email of user
   * @param ctx
   * @returns {*}
   */
  @Route({path: "/verify-email", method: HttpMethod.GET})

  public async verifyEmail(ctx: any) {
    const verificationCode: string = ctx.query.verificationCode
    try {
      const userData = await UserTable.findOne({verificationCode})
      if (userData) {
         if(userData.verificationEmailExpireAt > moment().unix().toString()) {
           await UserTable.updateOne(
              {_id: userData._id},
              {$set: {verificationEmailExpireAt: null, verificationCode: '', email: ctx.query.email}}
          )

          await ctx.render("message.pug", {message: 'Email has been verified successfully', type: 'Success'});
         }
        else {
          await ctx.render("message.pug", {message: 'Token has Expired.', type: 'error'} );
        }

      } else {
        await ctx.render("message.pug", {message: 'Token has Expired.', type: 'error'} );
      }
    } catch (e) {
      throw new Error (e.message);
    }
   }

  /**
   * This method is used to check unique email
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/check-username/:username", method: HttpMethod.GET })
  @Auth()
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
}

export default new AliveController();
