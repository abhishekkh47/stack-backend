import Koa from "koa";
import crypto from "crypto";
import { Route, updateContacts, wireInboundMethod } from "../../../utility";
import BaseController from "./base";
import { EUSERSTATUS, HttpMethod } from "../../../types";
import {
  ParentChildTable,
  StateTable,
  UserTable,
  WebhookTable,
} from "../../../model";
import { validation } from "../../../validations/apiValidation";
import { PrimeTrustJWT, Auth } from "../../../middleware";

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
    switch (body.resource_type) {
      case "contact":
        const checkAccountIdExists = await ParentChildTable.findOne({
          "teens.accountId": body.account_id,
        });
        if (!checkAccountIdExists) {
          return this.BadRequest(ctx, "Account Id Doesn't Exists");
        }
        const userExists = await UserTable.findOne({
          _id: checkAccountIdExists.userId,
        });
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
                kycMessages: body.data["kyc_required_actions"],
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

  /**
   * @description This method is update the error related information in prime trust as well as our database
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/update-primetrust-data-test", method: HttpMethod.POST })
  @Auth()
  @PrimeTrustJWT()
  public async changeDataIntoPrimeTrustDemo(ctx: any) {
    const user = ctx.request.user;
    const jwtToken = ctx.request.primeTrustToken;
    const userExists: any = await UserTable.findOne({ _id: user._id }).populate(
      "stateId",
      ["name", "shortName"]
    );
    if (!userExists) {
      return this.BadRequest(ctx, "User Not Found");
    }
    const reqParam = ctx.request.body;
    let state = null;
    if (reqParam.state) {
      state = await (
        await StateTable.findOne({ _id: reqParam.state })
      ).shortName;
      if (!state) {
        return this.BadRequest(ctx, "State Not Found");
      }
    }
    return validation.changePrimeTrustValidation(
      reqParam,
      ctx,
      async (validate) => {
        if (validate) {
          if (!reqParam) {
            return this.BadRequest(ctx, "No Data to update in prime trust");
          }
          let parentExists = await ParentChildTable.findOne({
            userId: user._id,
          });
          const updateContactRequest = {
            data: {
              type: "contacts",
              attributes: {
                "contact-type": "natural_person",
                "date-of-birth": reqParam.dob ? reqParam.dob : userExists.dob,
                name: reqParam.firstName
                  ? reqParam.firstName + " " + reqParam.lastName
                  : userExists.firstName + " " + userExists.lastName,
                "tax-id-number": reqParam.taxIdNo
                  ? reqParam.taxIdNo
                  : userExists.taxIdNo,
                "primary-address": {
                  "street-1": reqParam.address
                    ? reqParam.address
                    : userExists.address,
                  "street-2": reqParam.unitApt
                    ? reqParam.unitApt
                    : userExists.unitApt,
                  "postal-code": userExists.postalCode
                    ? reqParam.postalCode
                    : userExists.postalCode,
                  city: reqParam.city ? reqParam.city : userExists.city,
                  region: reqParam.state ? state : userExists.stateId.shortName,
                  country: reqParam.country
                    ? reqParam.country
                    : userExists.country,
                },
              },
            },
          };
          // const updateResponse = await updateContacts(
          //   jwtToken,
          //   parentExists.contactId,
          //   updateContactRequest
          // );
          return this.Ok(ctx, { message: "Finally Done", data: reqParam });
        }
      }
    );
  }

  /**
   * @description This method is update the error related information in prime trust as well as our database
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/update-primetrust-data", method: HttpMethod.POST })
  @Auth()
  @PrimeTrustJWT()
  public async changeDataIntoPrimeTrust(ctx: any) {
    const input = ctx.request.body;
    return validation.changePrimeTrustValidation(
      input,
      ctx,
      async (validate) => {
        if (validate) {
          let existingStatus = (
            await UserTable.findOne(
              { _id: ctx.request.user._id },
              { status: 1, _id: 0 }
            )
          ).status;
          if (
            existingStatus === EUSERSTATUS.KYC_DOCUMENT_VERIFIED ||
            existingStatus === EUSERSTATUS.KYC_DOCUMENT_UPLOAD
          )
            return this.BadRequest(
              ctx,
              existingStatus === EUSERSTATUS.KYC_DOCUMENT_VERIFIED
                ? "User already verified."
                : "User's data already uploaded."
            );

          let contactId = (
            await ParentChildTable.findOne(
              { userId: ctx.request.user._id },
              { contactId: 1, _id: 0 }
            )
          ).contactId;
          if (!contactId) return this.BadRequest(ctx, "Contact ID not found");

          const updates: any = {};
          if (input["first-name"]) updates.firstName = input["first-name"];
          if (input["last-name"]) updates.lastName = input["last-name"];
          if (input["date-of-birth"]) updates.dob = input["date-of-birth"];
          if (input["tax-id-number"]) updates.taxIdNo = input["tax-id-number"];
          if (input["tax-state"]) updates.taxState = input["tax-state"];
          if (input["primary-address"]) {
            updates.city = input["primary-address"]["city"];
            updates.country = input["primary-address"]["country"];
            updates.postalCode = input["primary-address"]["postal-code"];
            updates.stateId = input["primary-address"]["region"];
            updates.address = input["primary-address"]["street-1"];
          }

          if (input["tax-state"]) {
            let taxState = await StateTable.findOne(
              { _id: input["tax-state"] },
              { shortName: 1, _id: 0 }
            );
            if (!taxState)
              return this.BadRequest(ctx, "Invalid Tax-State-ID entered");
            input["tax-state"] = taxState.shortName;
          }

          if (input["primary-address"]) {
            let state = await StateTable.findOne({
              _id: input["primary-address"].region,
            });
            if (!state) return this.BadRequest(ctx, "Invalid State-ID entered");
            input["primary-address"].region = state.shortName;
          }

          let response = await updateContacts(
            ctx.request.primeTrustToken,
            contactId,
            {
              type: "contacts",
              attributes: {
                "contact-type": "natural_person",
                ...input,
              },
            }
          );
          if (response.status === 400)
            return this.BadRequest(ctx, {
              message: "Something went wrong. Please try again.",
              response,
            });

          await UserTable.updateOne(
            { _id: ctx.request.user._id },
            {
              $set: {
                status: EUSERSTATUS.KYC_DOCUMENT_UPLOAD,
                ...updates,
              },
            }
          );
          return this.Ok(ctx, { message: "Info updated successfully." });
        }
      }
    );
  }
}

export default new WebHookController();
