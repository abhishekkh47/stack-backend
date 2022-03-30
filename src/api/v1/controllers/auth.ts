import Koa from "koa";

import { getJwtToken, Route, verifyToken } from "@app/utility";
import BaseController from "./base";
import { HttpMethod, IUser } from "@app/types";
import { AuthService } from "@app/services";
import { Auth } from "@app/middleware";
import { validation } from "@app/validations/apiValidation";
import { UserTable } from "@app/model";

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

  @Route({ path: "/change-password", method: HttpMethod.POST })
  @Auth()
  public changePassword(ctx: any) {
    const user = ctx.request.user;
    const reqParam = ctx.request.body;
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
          UserTable.findOne({ _id: user._id }).then(async (userData: any) => {
            if (!userData) {
              return this.NotFound(ctx, "User Not Found");
            }
            const checkOldPassword = await AuthService.comparePassword(
              reqParam.old_password,
              userData.old_password
            );
            if (checkOldPassword === false) {
              return this.BadRequest(ctx, "Old Password is Incorrect");
            }
            const compareNewPasswordWithOld = await AuthService.comparePassword(
              reqParam.new_password,
              reqParam.old_password
            );
            if (compareNewPasswordWithOld === false) {
              return this.BadRequest(
                ctx,
                "New Password should not be similiar to Old Password"
              );
            }
            if (reqParam.new_password !== reqParam.confirm_password) {
              return this.BadRequest(
                ctx,
                "New Password and Confirm Password are not same"
              );
            }
            const newPassword = await AuthService.encryptPassword(
              reqParam.new_password
            );
            console.log(newPassword);
            await UserTable.updateOne(
              { _id: user._id },
              {
                $set: {
                  password: newPassword,
                },
              }
            );
            return this.Ok(ctx, { message: "Password Changed Successfully" });
          });
        }
      }
    );
  }
}

export default new AliveController();
