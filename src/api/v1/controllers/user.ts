import Koa from "koa";
import BaseController from "./base";
import { Auth, PrimeTrustJWT } from "@app/middleware";
import { validation } from "@app/validations/apiValidation";
import { ParentChildTable, UserTable } from "@app/model";
import fs from "fs";
import {
  checkValidImageExtension,
  createAccount,
  Route,
  uploadFiles,
} from "@app/utility";
import { HttpMethod } from "@app/types";
import multer from "@koa/multer";
var FormData = require("form-data");
import path from "path";
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, path.join(__dirname, "../../../uploads"));
//   },
//   filename: function (req, file, cb) {
//     let type = file.originalname.split(".")[1];
//     cb(null, `${file.fieldname}-${Date.now().toString(16)}.${type}`);
//   },
// });

const upload = multer({
  // storage,
  limits: {
    fileSize: 5000000, // 1000000 Bytes = 1 MB
  },
  fileFilter(req, file, cb) {
    console.log(file, "file");
    if (!checkValidImageExtension(file)) {
      return cb(new Error("Please upload a Image of valid extension"));
    }
    cb(null, true);
  },
});

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
  @Route({
    path: "/upload-id-proof",
    method: HttpMethod.POST,
    middleware: [
      upload.fields([
        {
          name: "front_upload",
        },
        { name: "back_upload" },
      ]),
    ],
  })
  @Auth()
  @PrimeTrustJWT()
  public async uploadFiles(ctx: any) {
    const files = ctx.request.files;
    const user = ctx.request.user;
    const jwtToken = ctx.request.primeTrustToken;
    if (files.length == 0) {
      return this.BadRequest(
        ctx,
        "Please upload identification files in order to complete KYC"
      );
    }
    /**
     * Validations to be done
     */
    // const userExists = await UserTable.findOne({ _id: user._id });
    // if (!userExists) {
    //   return this.BadRequest(ctx, "User Not Found");
    // }
    // const parentChildExists = await ParentChildTable.findOne({
    //   userId: user._id,
    // });
    // const fullName = userExists.firstName + " " + userExists.lastName;
    // const data = {
    //   type: "account",
    //   attributes: {
    //     "account-type": "custodial",
    //     name: fullName + " child-1",
    //     "authorized-signature": fullName,
    //     "webhook-config": {
    //       url: "https://eo2q11k4r3fh62w.m.pipedream.net",
    //     },
    //     owner: {
    //       "contact-type": "natural_person",
    //       name: fullName,
    //       email: userExists.email,
    //       "date-of-birth": userExists.dob,
    //       "tax-id-number": userExists.taxIdNo,
    //       "tax-country": userExists.country,
    //       "ip-address": "127.0.0.2",
    //       geolocation: "",
    //       "primary-phone-number": {
    //         country: "CA",
    //         number: userExists.mobile,
    //         sms: false,
    //       },
    //       "primary-address": {
    //         "street-1": userExists.address,
    //         "street-2": "",
    //         "postal-code": userExists.postalCode,
    //         city: userExists.city,
    //         region: userExists.state,
    //         country: userExists.country,
    //       },
    //     },
    //   },
    // };
    // const createAccountData: any = await createAccount(jwtToken, data);
    // const errorResponse = {
    //   message: "Error in creating account in prime trust",
    //   data: createAccountData,
    // };
    // if (createAccountData.status == 400) {
    //   return this.BadRequest(ctx, errorResponse);
    // }
    // await ParentChildTable.updateOne(
    //   { userId: user._id, "teens.childId": parentChildExists.firstChildId },
    //   {
    //     $set: {
    //       contactId: createAccountData.data.included[0].id,
    //       "teens.$.accountId": createAccountData.data.data.id,
    //     },
    //   }
    // );
    /**
     * Upload file
     */
    console.log(files.front_upload[0], "files.front_upload[0]");
    const form = new FormData();
    form.append(
      "file",
      files.front_upload[0].buffer,
      files.front_upload[0].originalname
    );
    form.append("contact-id", "2d97f98d-a124-4c19-b603-452616710c7d");
    form.append("description", "Front Driving License");
    form.append("label", "Front Driving License");
    form.append("public", "true");
    const uploadFile = await uploadFiles(jwtToken, form);
    console.log(uploadFile);
    return this.Ok(ctx, { data: uploadFile });
  }

  public async userUpload() {}
}

export default new UserController();
