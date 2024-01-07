import * as Koa from "koa";
import { IController, IControllerRoute } from "@app/types";

class BaseController implements IController {
  public routes: IControllerRoute[] = [];

  private decoratorRoutes: IControllerRoute[];

  constructor() {
    if (this.decoratorRoutes && this.decoratorRoutes.length) {
      Array.prototype.push.apply(this.routes, this.decoratorRoutes);
    }
  }

  protected Ok<T>(ctx: Koa.Context | any, data: T, flag: boolean = null) {
    ctx.status = 200;
    ctx.body = flag ? { data, status: 200 } : { ...data, status: 200 };
  }

  protected Created<T>(ctx: Koa.Context | any, data: T) {
    ctx.status = 201;
    ctx.body = { ...data, status: 201 };
  }

  protected NoContent(ctx: Koa.Context | any) {
    ctx.status = 203;
    ctx.body = {};
  }

  protected NotFound(ctx: Koa.Context | any, message?: string) {
    ctx.throw(404, { status: 404, message: message || "Not found" });
  }

  protected BadRequest(ctx: Koa.Context | any, message?: any) {
    ctx.throw(400, { status: 400, message: message || "Bad request" });
  }

  protected UnAuthorized(ctx: Koa.Context | any, message?: string) {
    ctx.throw(401, { status: 401, message: message || "Unauthorized" });
  }

  /**
   * Only to give webhook response as 200 in case of bad request
   * @param ctx
   * @param message
   * @description This method is only used for webhook
   */
  protected OkWebhook(ctx: Koa.Context | any, message?: string) {
    ctx.status = 200;
    ctx.body = { message: message, status: 200 };
  }
}

export default BaseController;
