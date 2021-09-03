import * as Koa from 'koa';

import { IController, IControllerRoute } from '@app/types';

class BaseController implements IController {
  public routes: IControllerRoute[] = [];

  private decoratorRoutes: IControllerRoute[];

  constructor() {
    if (this.decoratorRoutes && this.decoratorRoutes.length) {
      Array.prototype.push.apply(this.routes, this.decoratorRoutes);
    }
  }

  protected Ok<T>(ctx: Koa.Context, data: T) {
    ctx.body = data;
  }

  protected Created<T>(ctx: Koa.Context, data: T) {
    ctx.status = 201;
    ctx.body = data;
  }

  protected NoContent(ctx: Koa.Context) {
    ctx.status = 203;
    ctx.body = {};
  }

  protected NotFound(ctx: Koa.Context, message?: string) {
    ctx.throw(404, message || 'Not found');
  }

  protected BadRequest(ctx: Koa.Context, message?: string) {
    ctx.throw(400, message || 'Bad request');
  }

  protected UnAuthorized(ctx: Koa.Context, message?: string) {
    ctx.throw(401, message || 'Unauthorized');
  }
}

export default BaseController;
