import Koa from 'koa';

import { Route } from '@app/utility';
import BaseController from './base';

class AliveController extends BaseController {
  @Route('/alive')
  public Alive(ctx: Koa.Context) {
    this.Ok(ctx, {
      status: 'ok',
      timestamp: Date.now(),
    });
  }
}

export default new AliveController();
