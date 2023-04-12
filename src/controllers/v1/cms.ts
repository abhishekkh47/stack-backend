import { CMSTable } from "@app/model";
import { HttpMethod } from "@app/types";
import { Route, CMS_LINKS } from "@app/utility";
import BaseController from "@app/controllers/base";

class CMSController extends BaseController {
  @Route({ path: "/get-cms/:type", method: HttpMethod.GET })
  public async getCMS(ctx: any) {
    if (!ctx.request.params.type) {
      return this.BadRequest(ctx, "Invalid Type");
    }
    const cms = await CMSTable.findOne({ type: ctx.request.params.type });
    if (!cms) return this.BadRequest(ctx, "Enter valid CMS type");
    return this.Ok(ctx, cms, true);
  }

  @Route({ path: "/get-cms-links", method: HttpMethod.GET })
  public async getCMSData(ctx: any) {
    let cms = {
      terms: CMS_LINKS.TERMS,
      amcPolicy: CMS_LINKS.AMC_POLICY,
      privacy: CMS_LINKS.PRIVACY_POLICY,
      ptUserAgreement: CMS_LINKS.PRIME_TRUST_USER_AGREEMENT,
    };
    return this.Ok(ctx, cms, true);
  }
}

export default new CMSController();
