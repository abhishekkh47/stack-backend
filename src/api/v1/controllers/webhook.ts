import Koa from "koa";
import crypto from "crypto";
import { Route, wireInboundMethod } from "../../../utility";
import BaseController from "./base";
import { EUSERSTATUS, HttpMethod } from "../../../types";
import { ParentChildTable, UserTable, WebhookTable } from "../../../model";

class WebHookController extends BaseController {
  /**
   * @description This method is used to add deposit for parent as well as teen
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/webhook-response", method: HttpMethod.POST })
  public async getWebhookData(ctx: any) {
    console.log(`++++++START WEBHOOK DATA+++++++++`);
    let body: any = ctx.request.body;
    await WebhookTable.create({
      title: body.resource_type,
      data: body,
    });
    /**
     * For kyc success or failure
     */
    console.log(body.resource_type, "body.resource_type");
    switch (body.resource_type) {
      case "contact":
        const checkAccountIdExists = await ParentChildTable.findOne({
          "teens.accountId": body.account_id,
        });
        console.log(checkAccountIdExists, "checkAccountIdExists");
        if (!checkAccountIdExists) {
          return this.BadRequest(ctx, "Account Id Doesn't Exists");
        }
        const userExists = await UserTable.findOne({
          _id: checkAccountIdExists.userId,
        });
        console.log(userExists, "userExists");
        if (!userExists) {
          return this.BadRequest(ctx, "User Not Found");
        }
        if (userExists.status == EUSERSTATUS.KYC_DOCUMENT_VERIFIED) {
          return this.BadRequest(ctx, "User KYC Document Verified");
        }
        /**
         * Failure phases
         */
        if (
          body.data &&
          body.data["kyc_required_actions"] &&
          Object.keys(body.data["kyc_required_actions"]).length > 0
        ) {
          await UserTable.updateOne(
            { _id: userExists._id },
            {
              $set: {
                kycMessages: Object.values(body.data["kyc_required_actions"]),
                status: EUSERSTATUS.KYC_DOCUMENT_UPLOAD_FAILED,
              },
            }
          );
          return this.Ok(ctx, { message: "User Kyc Failed" });
        }
        /**
         * Success phases
         */
        if (
          body.data &&
          body.data["changes"] &&
          body.data["changes"].length > 0 &&
          body.data["changes"].includes("cip-cleared") &&
          body.data["changes"].includes("aml-cleared") &&
          body.data["changes"].includes("identity-confirmed")
        ) {
          await UserTable.updateOne(
            { _id: userExists._id },
            {
              $set: {
                kycMessages: null,
                status: EUSERSTATUS.KYC_DOCUMENT_VERIFIED,
              },
            }
          );
          return this.Ok(ctx, { message: "User Kyc Success" });
        }
        break;
      default:
        return this.BadRequest(ctx, `Resource Type ${body.resource_type}`);
    }
    console.log(`++++++END WEBHOOK DATA+++++++++`);
    return this.Ok(ctx, { message: "Success" });
  }
}

export default new WebHookController();
