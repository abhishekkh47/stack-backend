import Koa from "koa";

import { Route } from "@app/utility";
import BaseController from "./base";
import { HttpMethod } from "@app/types";

class WebhookController extends BaseController {
  @Route("/webhook/circle", HttpMethod.GET)
  public CircleWebhookGet(ctx: Koa.Context) {
    // console.log(ctx);
    this.Ok(ctx, {
      status: "ok",
      timestamp: Date.now(),
    });
  }

  @Route("/webhook/circle", HttpMethod.POST)
  public CircleWebhookPost(ctx: Koa.Context) {
    // console.log(ctx.request.body);
    this.Ok(ctx, {
      status: "ok",
      timestamp: Date.now(),
    });
  }
}

export default new WebhookController();
