import Koa from "koa";

import { getJwtToken, Route, verifyToken } from "@app/utility";
import BaseController from "./base";
import { HttpMethod } from "@app/types";
import { AuthService } from "@app/services";

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
}

export default new AliveController();
