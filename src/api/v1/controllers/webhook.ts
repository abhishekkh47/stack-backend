import Koa from "koa";
import crypto from "crypto";
import {
  Route,
  updateContacts,
  uploadIdProof,
  wireInboundMethod,
  kycDocumentChecks,
  uploadFilesFetch,
} from "../../../utility";
import BaseController from "./base";
import {
  ETransactionStatus,
  EUSERSTATUS,
  HttpMethod,
  EUserType,
} from "../../../types";
import {
  ParentChildTable,
  StateTable,
  UserTable,
  TransactionTable,
  WebhookTable,
} from "../../../model";
import { validation } from "../../../validations/apiValidation";
import { PrimeTrustJWT, Auth } from "../../../middleware";
import fs from "fs";
import path from "path";

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
    switch (body.resource_type) {
      /**
       * For kyc success or failure
       */
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
      /**
       * For buy and sell crypto
       */
      case "facilitated_trades":
        let checkQuoteIdExists = await TransactionTable.findOne({
          executedQuoteId: body.resource_id,
        });
        if (!checkQuoteIdExists) {
          return this.BadRequest(ctx, "Quote Id Doesn't Exists");
        }
        if (body.action == "settled") {
          await TransactionTable.updateOne(
            { _id: checkQuoteIdExists._id },
            { $set: { status: ETransactionStatus.SETTLED } }
          );
          return this.Ok(ctx, { message: "Trade Successfull" });
        } else {
          return this.BadRequest(ctx, "Bad request for asset");
        }
      /**
       * For deposit
       */
      case "contingent_holds":
        let checkQuoteIdExistsDeposit = await TransactionTable.findOne({
          executedQuoteId: body.resource_id,
        });
        if (!checkQuoteIdExistsDeposit) {
          return this.BadRequest(ctx, "Fund Transfer Id Doesn't Exists");
        }
        if (body.action == "update") {
          await TransactionTable.updateOne(
            { _id: checkQuoteIdExistsDeposit._id },
            { $set: { status: ETransactionStatus.SETTLED } }
          );
          return this.Ok(ctx, { message: "Deposit Successfull" });
        } else {
          return this.BadRequest(ctx, "Bad request for asset");
        }
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
  @Route({
    path: "/update-primetrust-data",
    method: HttpMethod.POST,
    middleware: [uploadIdProof.single("address_proof_front")],
  })
  @Auth()
  @PrimeTrustJWT()
  public async changeDataIntoPrimeTrust(ctx: any) {
    const files = ctx.request.file;
    const input = ctx.request.body;

    if (!files && !input) return this.BadRequest(ctx, "Invalid Request.");

    if (input["primary-address"])
      input["primary-address"] = JSON.parse(input["primary-address"]);
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
          ) {
            try {
              fs.unlinkSync(
                path.join(__dirname, "../../../../uploads", files.filename)
              );
            } catch (err) {}
            return this.BadRequest(
              ctx,
              existingStatus === EUSERSTATUS.KYC_DOCUMENT_VERIFIED
                ? "User already verified."
                : "User's data already uploaded."
            );
          }

          if (Object.keys(ctx.request.body).length) {
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
            if (input["tax-id-number"])
              updates.taxIdNo = input["tax-id-number"];
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
              if (!state)
                return this.BadRequest(ctx, "Invalid State-ID entered");
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
          }

          // in case of address proof error only ############################
          if (ctx.request.file) {
            const user = ctx.request.user;
            const jwtToken = ctx.request.primeTrustToken;
            if (!files)
              return this.BadRequest(
                ctx,
                "Please upload proof of address in order to complete KYC"
              );

            let existingStatus = (
              await UserTable.findOne(
                { _id: ctx.request.user._id },
                { status: 1, _id: 0 }
              )
            ).status;
            /**
             * Validations to be done
             */
            const userExists: any = await UserTable.findOne({
              _id: user._id,
            }).populate("stateId", ["name", "shortName"]);
            if (!userExists || userExists.type == EUserType.TEEN) {
              return this.BadRequest(ctx, "User Not Found");
            }
            const parentChildExists = await ParentChildTable.findOne({
              userId: user._id,
            });
            if (!parentChildExists) {
              return this.BadRequest(ctx, "User Not Found");
            }
            const accountIdDetails: any = await parentChildExists.teens.find(
              (x: any) =>
                x.childId.toString() ==
                parentChildExists.firstChildId.toString()
            );
            if (!accountIdDetails) {
              return this.BadRequest(ctx, "Account Details Not Found");
            }
            const fullName = userExists.firstName + " " + userExists.lastName;

            /**
             * Upload both file
             */
            let addressDocumentId = null;
            let uploadFileError = null;
            let uploadData = {
              "contact-id": parentChildExists.contactId,
              description: "Proof of Address",
              label: "Proof of Address",
              public: "true",
              file: fs.createReadStream(
                path.join(__dirname, "../../../../uploads", files.filename)
              ),
            };
            let uploadFile: any = await uploadFilesFetch(jwtToken, uploadData);
            if (uploadFile.status == 400) {
              uploadFileError = uploadFile.message;
            }
            if (
              uploadFile.status == 200 &&
              uploadFile.message.errors != undefined
            ) {
              uploadFileError = uploadFile.message;
            }
            if (uploadFileError) {
              /**
               * Delete image from our server
               */
              try {
                fs.unlinkSync(
                  path.join(__dirname, "../../../../uploads", files.filename)
                );
              } catch (err) {
                console.log("Error in removing image");
              }
              return this.BadRequest(ctx, uploadFileError);
            }
            addressDocumentId = uploadFile.message.data.id;
            /**
             * Checking the kyc document checks
             */
            const kycData = {
              type: "kyc-document-checks",
              attributes: {
                "contact-id": parentChildExists.contactId,
                "uploaded-document-id": addressDocumentId,
                "kyc-document-type": "residence_permit",
                identity: true,
                "identity-photo": true,
                "proof-of-address": true,
                "kyc-document-country": "US",
              },
            };
            let kycResponse: any = await kycDocumentChecks(jwtToken, kycData);
            if (kycResponse.status == 400) {
              return this.BadRequest(ctx, kycResponse.message);
            }
            if (
              kycResponse.status == 200 &&
              kycResponse.data.errors != undefined
            ) {
              return this.BadRequest(ctx, kycResponse.message);
            }
            const messages = [
              "Your documents are uploaded. Please wait for some time till we verify and get back to you.",
            ];
            await UserTable.updateOne(
              {
                _id: userExists._id,
              },
              {
                $set: {
                  status: EUSERSTATUS.KYC_DOCUMENT_UPLOAD,
                  kycMessages: messages,
                },
              }
            );
            /**
             * Updating the info in parent child table
             */
            await ParentChildTable.updateOne(
              {
                userId: user._id,
                "teens.childId": parentChildExists.firstChildId,
              },
              {
                $set: {
                  contactId: parentChildExists.contactId,
                  "teens.$.accountId": accountIdDetails.accountId,
                  proofOfAddressId: addressDocumentId,
                  kycDocumentId: kycResponse.data.data.id,
                },
              }
            );
            return this.Ok(ctx, {
              data: kycResponse.data,
              message:
                "Your documents are uploaded successfully. We are currently verifying your documents. Please wait for 24 hours.",
            });
          }

          return this.Ok(ctx, { message: "Info updated successfully." });
        }
      }
    );
  }
}

export default new WebHookController();
