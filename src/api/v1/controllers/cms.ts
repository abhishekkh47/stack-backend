import { CMSTable } from "@app/model";
import { HttpMethod } from "@app/types";
import { Route } from "@app/utility";
import BaseController from "./base";

class CMSController extends BaseController {
  @Route({ path: "/get-cms/:type", method: HttpMethod.GET })
  public async getCMS(ctx: any) {
    if (!ctx.request.params.type) {
      return this.BadRequest(ctx, "Invalid Type");
    }
    const cms = await CMSTable.findOne({ type: ctx.request.params.type });
    if (!cms) return this.BadRequest(ctx, "Enter valid CMS type");
    return this.Ok(ctx, { cms });
  }
}

export default new CMSController();
