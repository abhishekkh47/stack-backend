import Koa from "koa";

import { Route } from "@app/utility";
import BaseController from "./base";
import { DesignTemplates } from "@app/data";

class DesignTemplateController extends BaseController {
  @Route("/design-templates")
  public getDesignTemplates(ctx: Koa.Context) {
    this.Ok(ctx, DesignTemplates);
  }
}

export default new DesignTemplateController();
