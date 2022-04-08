import Koa from "koa";
import BaseController from "./base";
import { Auth, PrimeTrustJWT } from "@app/middleware";
import { validation } from "@app/validations/apiValidation";
import { ParentChildTable, UserTable } from "@app/model";
import { createAccount, Route } from "@app/utility";
import { HttpMethod } from "@app/types";

class UserController extends BaseController {
  @Route({ path: "/update-tax-info", method: HttpMethod.POST })
  @Auth()
  public async updateTaxInfo(ctx: any) {
    const input = ctx.request.body;
    return validation.updateTaxInfoRequestBodyValidation(
      input,
      ctx,
      async (validate) => {
        if (validate) {
          await UserTable.updateOne(
            { username: ctx.request.user.username },
            {
              $set: {
                taxIdNo: input.taxIdNo,
                taxState: input.taxState,
              },
            }
          );
          return this.Ok(ctx, { message: "Tax info updated successfully." });
        }
      }
    );
  }

  /**
   * @description This method is used to upload files
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/upload-id-proof", method: HttpMethod.POST })
  @Auth()
  @PrimeTrustJWT()
  public async uploadFiles(ctx: any) {
    const reqParam = ctx.request.body;
    const user = ctx.request.user;
    const jwtToken = ctx.request.primeTrustToken;
    /**
     * Validations to be done
     */
    const userExists = await UserTable.findOne({ _id: user._id });
    if (!userExists) {
      return this.BadRequest(ctx, "User Not Found");
    }
    const parentChildExists = await ParentChildTable.findOne({
      userId: user._id,
    });
    const fullName = userExists.firstName + " " + userExists.lastName;
    const data = {
      type: "account",
      attributes: {
        "account-type": "custodial",
        name: fullName + " child-1",
        "authorized-signature": fullName,
        "webhook-config": {
          url: "https://eo2q11k4r3fh62w.m.pipedream.net",
        },
        owner: {
          "contact-type": "natural_person",
          name: fullName,
          email: userExists.email,
          "date-of-birth": userExists.dob,
          "tax-id-number": userExists.taxIdNo,
          "tax-country": userExists.country,
          "ip-address": "127.0.0.2",
          geolocation: "",
          "primary-phone-number": {
            country: "CA",
            number: userExists.mobile,
            sms: false,
          },
          "primary-address": {
            "street-1": userExists.address,
            "street-2": "",
            "postal-code": userExists.postalCode,
            city: userExists.city,
            region: userExists.state,
            country: userExists.country,
          },
        },
      },
    };
    const createAccountData: any = await createAccount(jwtToken, data);
    const errorResponse = {
      message: "Error in creating account in prime trust",
      data: createAccountData,
    };
    if (createAccountData.status == 400) {
      return this.BadRequest(ctx, errorResponse);
    }
    await ParentChildTable.updateOne(
      { userId: user._id, "teens.childId": parentChildExists.firstChildId },
      {
        $set: {
          contactId: createAccountData.data.included[0].id,
          "teens.$.accountId": createAccountData.data.data.id,
        },
      }
    );
    return this.Ok(ctx, { data: createAccountData });
  }
}

export default new UserController();
