import Koa from "koa";
import crypto from "crypto";
import {
  Route,
  updateContacts,
  kycDocumentChecks,
  uploadFilesFetch,
  checkValidBase64String,
  getContactId,
  sendNotification,
  addAccountInfoInZohoCrm,
  getAccountStatusByAccountId,
  generateQuote,
  executeQuote,
  internalAssetTransfers,
} from "../../../utility";
import { NOTIFICATION, NOTIFICATION_KEYS } from "../../../utility/constants";
import { json, form } from "co-body";
import BaseController from "./base";
import {
  ETransactionStatus,
  EUSERSTATUS,
  HttpMethod,
  EUserType,
  EGIFTSTACKCOINSSETTING,
} from "../../../types";
import envData from "../../../config/index";
import {
  ParentChildTable,
  StateTable,
  UserTable,
  TransactionTable,
  WebhookTable,
  DeviceToken,
  AdminTable,
  Notification,
  CryptoTable,
} from "../../../model";
import { validation } from "../../../validations/apiValidation";
import { PrimeTrustJWT, Auth } from "../../../middleware";
import fs from "fs";
import path from "path";
import moment from "moment";

class WebHookController extends BaseController {
  /**
   * @description This method is used to add deposit for parent as well as teen
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/webhook-response", method: HttpMethod.POST })
  @PrimeTrustJWT(true)
  public async getWebhookData(ctx: any) {
    console.log(`++++++START WEBHOOK DATA+++++++++`);
    let body: any = ctx.request.body;
    let admin = await AdminTable.findOne({});
    await WebhookTable.create({
      title: body.resource_type,
      data: body,
    });
    const checkAccountIdExists: any = await ParentChildTable.findOne({
      "teens.accountId": body.account_id,
    }).populate("teens.childId", [
      "email",
      "isGifted",
      "isGiftedCrypto",
      "firstName",
      "lastName",
    ]);
    if (!checkAccountIdExists) {
      return this.OkWebhook(ctx, "Account Id Doesn't Exists");
    }
    const userExists = await UserTable.findOne({
      _id: checkAccountIdExists.userId,
    });
    if (!userExists) {
      return this.OkWebhook(ctx, "User Not Found");
    }
    /**
     * Notification Send for kyc fail or success
     */
    let deviceTokenData = await DeviceToken.findOne({
      userId: userExists._id,
    }).select("deviceToken");
    switch (body.resource_type) {
      /**
       * For kyc success or failure
       */
      case "contact":
      case "contacts":
        if (userExists.status == EUSERSTATUS.KYC_DOCUMENT_VERIFIED) {
          return this.OkWebhook(ctx, "User KYC Document Verified");
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
          /**
           * Update the status to zoho crm
           */
          let dataSentInCrm: any = {
            Account_Name: userExists.firstName + " " + userExists.lastName,
            Account_Status: "2",
          };
          let mainData = {
            data: [dataSentInCrm],
          };
          const dataAddInZoho = await addAccountInfoInZohoCrm(
            ctx.request.zohoAccessToken,
            mainData
          );
          if (deviceTokenData) {
            let notificationRequest = {
              key: NOTIFICATION_KEYS.KYC_FAILURE,
              title: NOTIFICATION.KYC_REJECTED_TITLE,
              message: null,
              userId: userExists._id,
            };
            const notificationCreated = await sendNotification(
              deviceTokenData.deviceToken,
              notificationRequest.title,
              notificationRequest
            );
          }
          return this.Ok(ctx, { message: "User Kyc Failed" });
        }
        /**
         * Success phases
         */
        if (
          body.data &&
          body.data["changes"] &&
          body.data["changes"].length > 0 &&
          (body.data["changes"].includes("cip-cleared") ||
            body.data["changes"].includes("aml-cleared") ||
            body.data["changes"].includes("identity-confirmed"))
        ) {
          let updateData = {};
          if (body.data["changes"].includes("aml-cleared")) {
            updateData = { ...updateData, amlCleared: true };
          }
          if (body.data["changes"].includes("cip-cleared")) {
            updateData = { ...updateData, cipCleared: true };
          }
          if (body.data["changes"].includes("identity-confirmed")) {
            updateData = { ...updateData, identityConfirmed: true };
          }
          await UserTable.updateOne(
            { _id: userExists._id },
            {
              $set: updateData,
            }
          );
          let checkUserAgain = await UserTable.findOne({ _id: userExists._id });
          if (
            checkUserAgain.cipCleared &&
            checkUserAgain.amlCleared &&
            checkUserAgain.identityConfirmed &&
            checkUserAgain.accountStatus == "opened" &&
            checkUserAgain.status != EUSERSTATUS.KYC_DOCUMENT_VERIFIED
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
            /**
             * Update the status to zoho crm
             */
            let dataSentInCrm: any = {
              Account_Name: userExists.firstName + " " + userExists.lastName,
              Account_Status: "3",
            };
            let mainData = {
              data: [dataSentInCrm],
            };
            await addAccountInfoInZohoCrm(
              ctx.request.zohoAccessToken,
              mainData
            );
            if (deviceTokenData) {
              let notificationRequest = {
                key: NOTIFICATION_KEYS.KYC_SUCCESS,
                title: NOTIFICATION.KYC_APPROVED_TITLE,
                message: NOTIFICATION.KYC_APPROVED_DESCRIPTION,
                userId: userExists._id,
              };
              await sendNotification(
                deviceTokenData.deviceToken,
                notificationRequest.title,
                notificationRequest
              );
            }
            /**
             * Gift stack coins to all teens whose parent's kyc is approved
             */
            if (admin.giftStackCoinsSetting == EGIFTSTACKCOINSSETTING.ON) {
              let allTeens = await checkAccountIdExists.teens.filter(
                (x) => x.childId.isGifted == EGIFTSTACKCOINSSETTING.OFF
              );
              let userIdsToBeGifted = [];
              if (allTeens.length > 0) {
                for await (let allTeen of allTeens) {
                  await userIdsToBeGifted.push(allTeen.childId._id);
                  /**
                   * Added in zoho
                   */
                  let dataSentInCrm: any = {
                    Account_Name:
                      allTeen.childId.firstName +
                      " " +
                      allTeen.childId.lastName,
                    Stack_Coins: admin.stackCoins,
                  };
                  let mainData = {
                    data: [dataSentInCrm],
                  };
                  const dataAddInZoho = await addAccountInfoInZohoCrm(
                    ctx.request.zohoAccessToken,
                    mainData
                  );
                }
              }
              await UserTable.updateMany(
                {
                  _id: { $in: userIdsToBeGifted },
                },
                {
                  $set: {
                    isGifted: EGIFTSTACKCOINSSETTING.ON,
                  },
                  $inc: {
                    preLoadedCoins: admin.stackCoins,
                  },
                }
              );
            }
            return this.Ok(ctx, { message: "User Kyc Success" });
          }
        }
        break;
      case "accounts":
        if (userExists.status == EUSERSTATUS.KYC_DOCUMENT_VERIFIED) {
          return this.OkWebhook(ctx, "User KYC Document Verified");
        }
        if (
          body.data &&
          body.data["changes"] &&
          body.data["changes"].length > 0 &&
          body.data["changes"].includes("status") &&
          userExists.accountStatus != "opened"
        ) {
          /**
           * Call account api by account id
           */
          let accountStatus = await getAccountStatusByAccountId(
            ctx.request.primeTrustToken,
            body.account_id
          );
          if (
            accountStatus &&
            accountStatus.data &&
            accountStatus.data.attributes
          ) {
            const getUserDataAgain = await UserTable.findOneAndUpdate(
              { _id: userExists._id },
              {
                $set: {
                  accountStatus: accountStatus.data.attributes["status"],
                },
              }
            );
            if (
              accountStatus.data.attributes["status"] == "opened" &&
              getUserDataAgain.cipCleared &&
              getUserDataAgain.amlCleared &&
              getUserDataAgain.identityConfirmed &&
              getUserDataAgain.status != EUSERSTATUS.KYC_DOCUMENT_VERIFIED
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
              /**
               * Update the status to zoho crm
               */
              let dataSentInCrm: any = {
                Account_Name: userExists.firstName + " " + userExists.lastName,
                Account_Status: "3",
              };
              let mainData = {
                data: [dataSentInCrm],
              };
              const dataAddInZoho = await addAccountInfoInZohoCrm(
                ctx.request.zohoAccessToken,
                mainData
              );
              if (deviceTokenData) {
                let notificationRequest = {
                  key: NOTIFICATION_KEYS.KYC_SUCCESS,
                  title: NOTIFICATION.KYC_APPROVED_TITLE,
                  message: NOTIFICATION.KYC_APPROVED_DESCRIPTION,
                  userId: userExists._id,
                };
                await sendNotification(
                  deviceTokenData.deviceToken,
                  notificationRequest.title,
                  notificationRequest
                );
              }
              /**
               * Gift stack coins to all teens whose parent's kyc is approved
               */
              if (admin.giftStackCoinsSetting == EGIFTSTACKCOINSSETTING.ON) {
                let allTeens = await checkAccountIdExists.teens.filter(
                  (x) => x.childId.isGifted == EGIFTSTACKCOINSSETTING.OFF
                );
                let userIdsToBeGifted = [];
                if (allTeens.length > 0) {
                  for await (let allTeen of allTeens) {
                    await userIdsToBeGifted.push(allTeen.childId._id);
                    /**
                     * Added in zoho
                     */
                    let dataSentInCrm: any = {
                      Account_Name:
                        allTeen.childId.firstName +
                        " " +
                        allTeen.childId.lastName,
                      Stack_Coins: admin.stackCoins,
                    };
                    let mainData = {
                      data: [dataSentInCrm],
                    };
                    const dataAddInZoho = await addAccountInfoInZohoCrm(
                      ctx.request.zohoAccessToken,
                      mainData
                    );
                  }
                }
                await UserTable.updateMany(
                  {
                    _id: { $in: userIdsToBeGifted },
                  },
                  {
                    $set: {
                      isGifted: EGIFTSTACKCOINSSETTING.ON,
                    },
                    $inc: {
                      preLoadedCoins: admin.stackCoins,
                    },
                  }
                );
              }
            }
          }
        }
        /**
         * When account gets closed send notification
         */
        if (
          body.data &&
          body.data["changes"] &&
          body.data["changes"].length > 0 &&
          body.data["changes"].includes("disbursements-frozen")
        ) {
          if (deviceTokenData) {
            let notificationRequest = {
              key: NOTIFICATION_KEYS.ACCOUNT_CLOSED,
              title: NOTIFICATION.ACCOUNT_CLOSED_TITLE,
              message: NOTIFICATION.ACCOUNT_CLOSED_DESCRIPTION,
              userId: userExists._id,
            };
            await sendNotification(
              deviceTokenData.deviceToken,
              notificationRequest.title,
              notificationRequest
            );
          }
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
          return this.OkWebhook(ctx, "Quote Id Doesn't Exists");
        }
        if (body.action == "settled") {
          const checkData = await TransactionTable.updateOne(
            { _id: checkQuoteIdExists._id },
            { $set: { status: ETransactionStatus.SETTLED } }
          );
          return this.Ok(ctx, { message: "Trade Successfull" });
        } else {
          return this.OkWebhook(ctx, "Bad request for asset");
        }
      /**
       * For deposit
       */
      case "contingent_holds":
      case "funds_transfers":
        let checkQuoteIdExistsDeposit = await TransactionTable.findOne({
          executedQuoteId: body.resource_id,
        });
        if (!checkQuoteIdExistsDeposit) {
          return this.OkWebhook(ctx, "Fund Transfer Id Doesn't Exists");
        }
        if (body.action == "update") {
          if (
            (body.resource_type == "funds_transfers" &&
              body.data.changes.includes("contingencies-cleared-on")) ||
            body.resource_type == "contingent_holds"
          ) {
            await TransactionTable.updateOne(
              { _id: checkQuoteIdExistsDeposit._id },
              { $set: { status: ETransactionStatus.SETTLED } }
            );
            return this.Ok(ctx, { message: "Deposit Successfull" });
          }
        } else {
          return this.OkWebhook(ctx, "Bad request for asset");
        }
      default:
        return this.OkWebhook(ctx, `Resource Type ${body.resource_type}`);
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
  })
  @Auth()
  @PrimeTrustJWT()
  public async changeDataIntoPrimeTrust(ctx: any) {
    const body = await json(ctx, { limit: "150mb" });
    if (!Object.keys(body).length)
      return this.BadRequest(ctx, "Invalid Request.");

    const input = body;

    if (input["primary-address"]) {
      input["primary-address"] = JSON.parse(input["primary-address"]);
    } else {
      input["primary-address"] = {};
    }

    return validation.changePrimeTrustValidation(
      input,
      ctx,
      async (validate) => {
        if (validate) {
          const jwtToken = ctx.request.primeTrustToken;
          const user = ctx.request.user;

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

          let successResponse: any = {};

          // in case of proof of address file upload
          if (input.media) {
            let validBase64 = checkValidBase64String(input.media);
            if (!validBase64)
              return this.BadRequest(ctx, "Please enter valid image");
            const extension =
              input.media && input.media !== ""
                ? input.media.split(";")[0].split("/")[1]
                : "";
            const imageName =
              input.media && input.media !== ""
                ? `address_proof_front_${moment().unix()}.${extension}`
                : "";
            const imageExtArr = ["jpg", "jpeg", "png"];
            if (imageName && !imageExtArr.includes(extension))
              return this.BadRequest(ctx, "Please add valid extension");

            const decodedImage = Buffer.from(
              input.media.replace(/^data:image\/\w+;base64,/, ""),
              "base64"
            );

            if (!fs.existsSync(path.join(__dirname, "../../../../uploads")))
              fs.mkdirSync(path.join(__dirname, "../../../../uploads"));
            fs.writeFileSync(
              path.join(__dirname, "../../../../uploads", imageName),
              decodedImage,
              "base64"
            );
            const accountIdDetails: any = await parentChildExists.teens.find(
              (x: any) =>
                x.childId.toString() ==
                parentChildExists.firstChildId.toString()
            );
            if (!accountIdDetails) {
              return this.BadRequest(ctx, "Account Details Not Found");
            }
            const fullName = userExists.firstName + " " + userExists.lastName;

            let addressDocumentId = null;
            let uploadFileError = null;
            let uploadData = {
              "contact-id": parentChildExists.contactId,
              description: "Proof of Address",
              label: "Proof of Address",
              public: "true",
              file: fs.createReadStream(
                path.join(__dirname, "../../../../uploads", imageName)
              ),
            };
            let uploadFile: any = await uploadFilesFetch(jwtToken, uploadData);
            if (uploadFile.status == 400) uploadFileError = uploadFile.message;
            if (
              uploadFile.status == 200 &&
              uploadFile.message.errors != undefined
            )
              uploadFileError = uploadFile.message;
            if (uploadFileError) return this.BadRequest(ctx, uploadFileError);

            addressDocumentId = uploadFile.message.data.id;
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
                  proofOfAddressId: addressDocumentId,
                },
              }
            );
            successResponse.uploadAddressProofReponse = {
              message:
                "Your documents are uploaded successfully. We are currently verifying your documents. Please wait for 24 hours.",
            };
          }

          // in case of driving license file upload
          if (input.id_proof_front && input.id_proof_back) {
            let validBase64Front = await checkValidBase64String(
              input.id_proof_front
            );
            if (!validBase64Front) {
              return this.BadRequest(ctx, "Please enter valid front image");
            }
            let validBase64Back = await checkValidBase64String(
              input.id_proof_back
            );
            if (!validBase64Back) {
              return this.BadRequest(ctx, "Please enter valid back image");
            }
            let files = [
              { id_proof_front: input.id_proof_front },
              { id_proof_back: input.id_proof_back },
            ];
            /**
             * Upload image front and back accordingly
             */
            let validExtensionExists = false;
            let newArrayFiles = [];
            for await (let identificationFile of files) {
              const extension =
                identificationFile.id_proof_front &&
                identificationFile.id_proof_front !== ""
                  ? identificationFile.id_proof_front
                      .split(";")[0]
                      .split("/")[1]
                  : identificationFile.id_proof_back &&
                    identificationFile.id_proof_back !== ""
                  ? identificationFile.id_proof_back.split(";")[0].split("/")[1]
                  : "";
              const imageName =
                identificationFile.id_proof_front &&
                identificationFile.id_proof_front !== ""
                  ? `id_proof_front_${moment().unix()}.${extension}`
                  : `id_proof_back_${moment().unix()}.${extension}`;
              const imageExtArr = ["jpg", "jpeg", "png"];
              if (imageName && !imageExtArr.includes(extension)) {
                validExtensionExists = true;
                break;
              }
              const decodedImage = Buffer.from(
                identificationFile.id_proof_front
                  ? identificationFile.id_proof_front.replace(
                      /^data:image\/\w+;base64,/,
                      ""
                    )
                  : identificationFile.id_proof_back.replace(
                      /^data:image\/\w+;base64,/,
                      ""
                    ),
                "base64"
              );
              if (!fs.existsSync(path.join(__dirname, "../../../../uploads"))) {
                fs.mkdirSync(path.join(__dirname, "../../../../uploads"));
              }
              fs.writeFileSync(
                path.join(__dirname, "../../../../uploads", imageName),
                decodedImage,
                "base64"
              );
              newArrayFiles.push({
                fieldname: identificationFile.id_proof_front
                  ? "id_proof_front"
                  : "id_proof_back",
                filename: imageName,
              });
            }
            if (validExtensionExists) {
              return this.BadRequest(ctx, "Please add valid extension");
            }
            /**
             * Upload both file
             */
            let frontDocumentId = null;
            let backDocumentId = null;
            let uploadFileError = null;
            for await (let fileData of newArrayFiles) {
              let uploadData = {
                "contact-id": parentChildExists.contactId,
                description:
                  fileData.fieldname == "id_proof_front"
                    ? "Front Side Driving License"
                    : "Back Side Driving License",
                label:
                  fileData.fieldname == "id_proof_back"
                    ? "Front Side Driving License"
                    : "Back Side Driving License",
                public: "true",
                file: fs.createReadStream(
                  path.join(__dirname, "../../../../uploads", fileData.filename)
                ),
              };
              let uploadFile: any = await uploadFilesFetch(
                jwtToken,
                uploadData
              );
              if (uploadFile.status == 400) {
                uploadFileError = uploadFile.message;
                break;
              }
              if (
                uploadFile.status == 200 &&
                uploadFile.message.errors != undefined
              ) {
                uploadFileError = uploadFile.message;
                break;
              }
              fileData.fieldname == "id_proof_front"
                ? (frontDocumentId = uploadFile.message.data.id)
                : (backDocumentId = uploadFile.message.data.id);
            }
            if (uploadFileError) {
              return this.BadRequest(ctx, uploadFileError);
            }
            /**
             * Checking the kyc document checks
             */
            const kycData = {
              type: "kyc-document-checks",
              attributes: {
                "contact-id": parentChildExists.contactId,
                "uploaded-document-id": frontDocumentId,
                "backside-document-id": backDocumentId,
                "kyc-document-type": "drivers_license",
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
              return this.BadRequest(ctx, kycResponse);
            }
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
                  frontDocumentId: frontDocumentId,
                  backDocumentId: backDocumentId,
                  kycDocumentId: kycResponse.data.data.id,
                },
              }
            );
          }

          const updates: any = {};
          const requestPrimeTrust = {};
          if (input["first-name"]) {
            updates.firstName = input["first-name"];
            requestPrimeTrust["first-name"] = input["first-name"];
          }
          if (input["last-name"]) {
            updates.lastName = input["last-name"];
            requestPrimeTrust["last-name"] = input["last-name"];
          }
          if (input["date-of-birth"]) {
            updates.dob = input["date-of-birth"];
            requestPrimeTrust["date-of-birth"] = input["date-of-birth"];
          }
          if (input["tax-id-number"]) {
            updates.taxIdNo = input["tax-id-number"];
            requestPrimeTrust["tax-id-number"] = input["tax-id-number"];
          }
          if (input["tax-state"]) {
            updates.taxState = input["tax-state"];
            requestPrimeTrust["tax-state"] = input["tax-state"];
          }
          if (
            input["primary-address"] &&
            Object.keys(input["primary-address"]).length > 0
          ) {
            requestPrimeTrust["primary-address"] = {};
            updates.city = input["primary-address"]["city"];
            requestPrimeTrust["primary-address"]["city"] =
              input["primary-address"]["city"];
            updates.unitApt = input["primary-address"]["unitApt"]
              ? input["primary-address"]["unitApt"]
              : userExists.unitApt;
            requestPrimeTrust["primary-address"]["street-2"] = input[
              "primary-address"
            ]["unitApt"]
              ? input["primary-address"]["unitApt"]
              : userExists.unitApt;
            updates.country = input["primary-address"]["country"];
            requestPrimeTrust["primary-address"]["country"] =
              input["primary-address"]["country"];
            updates.postalCode = input["primary-address"]["postal-code"];
            requestPrimeTrust["primary-address"]["postal-code"] =
              input["primary-address"]["postal-code"];
            updates.state = input["primary-address"]["region"];
            requestPrimeTrust["primary-address"]["region"] =
              input["primary-address"]["region"];
            updates.address = input["primary-address"]["street-1"];
            requestPrimeTrust["primary-address"]["street-1"] =
              input["primary-address"]["street-1"];
          }

          let contactId = await getContactId(ctx.request.user._id);
          if (!contactId) return this.BadRequest(ctx, "Contact ID not found");

          if (input["tax-state"]) {
            let taxState = await StateTable.findOne(
              { _id: input["tax-state"] },
              { shortName: 1, _id: 0 }
            );
            if (!taxState)
              return this.BadRequest(ctx, "Invalid Tax-State-ID entered");
            input["tax-state"] = taxState.shortName;
            requestPrimeTrust["tax-state"] = taxState.shortName;
          }
          if (
            input["primary-address"] &&
            Object.keys(input["primary-address"]).length > 0
          ) {
            let state = await StateTable.findOne({
              shortName: input["primary-address"].region,
            });
            if (!state) return this.BadRequest(ctx, "Invalid State-ID entered");
            input["primary-address"].region = state.shortName;
            requestPrimeTrust["primary-address"].region = state.shortName;
          }
          let response = await updateContacts(
            ctx.request.primeTrustToken,
            contactId,
            {
              type: "contacts",
              attributes: {
                "contact-type": "natural_person",
                ...requestPrimeTrust,
              },
            }
          );
          if (response.status === 400) {
            return this.BadRequest(ctx, response.message);
          }
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

  /**
   * @description This method is used for zoho crm added data in crm platform
   * @param ctx
   * @returns
   */
  @Route({
    path: "/test-zoho",
    method: HttpMethod.POST,
  })
  @PrimeTrustJWT(true)
  public async testZoho(ctx: any) {
    let jwtToken = ctx.request.primeTrustToken;
    let crypto = await CryptoTable.findOne({ symbol: "BTC" });
    const requestQuoteDay: any = {
      data: {
        type: "quotes",
        attributes: {
          "account-id": envData.OPERATIONAL_ACCOUNT,
          "asset-id": crypto.assetId,
          hot: true,
          "transaction-type": "buy",
          total_amount: "5",
        },
      },
    };
    const generateQuoteResponse: any = await generateQuote(
      jwtToken,
      requestQuoteDay
    );
    if (generateQuoteResponse.status == 400) {
      return this.BadRequest(ctx, generateQuoteResponse.message);
    }
    /**
     * Execute a quote
     */
    const requestExecuteQuote: any = {
      data: {
        type: "quotes",
        attributes: {
          "account-id": envData.OPERATIONAL_ACCOUNT,
          "asset-id": crypto.assetId,
        },
      },
    };
    const executeQuoteResponse: any = await executeQuote(
      jwtToken,
      generateQuoteResponse.data.data.id,
      requestExecuteQuote
    );
    if (executeQuoteResponse.status == 400) {
      return this.BadRequest(ctx, executeQuoteResponse.message);
    }
    let internalTransferRequest = {
      data: {
        type: "internal-asset-transfers",
        attributes: {
          "unit-count": executeQuoteResponse.data.data.attributes["unit-count"],
          "from-account-id": envData.OPERATIONAL_ACCOUNT,
          "to-account-id": "24e34898-d86e-4773-a9f7-9911de8bc28b",
          "asset-id": crypto.assetId,
          reference: "$5 BTC gift from Stack",
          "hot-transfer": true,
        },
      },
    };
    const internalTransferResponse: any = await internalAssetTransfers(
      jwtToken,
      internalTransferRequest
    );
    if (internalTransferResponse.status == 400) {
      return this.BadRequest(ctx, internalTransferResponse.message);
    }
    if (internalTransferResponse.status == 200) {
      return this.Ok(ctx, {
        data: internalTransferResponse.data.data.id,
      });
    }
    // const checkAccountIdExists: any = await ParentChildTable.findOne({
    //   "teens.childId": new ObjectId("62726e1de68ae364f3a510d9"),
    // })
    //   .populate("teens.childId", [
    //     "email",
    //     "isGifted",
    //     "isGiftedCrypto",
    //     "firstName",
    //     "lastName",
    //     "accountId",
    //   ])
    //   .populate({ path: "teens.childId" });
    // let allTeensGiftedCrypto = await checkAccountIdExists.teens.filter(
    //   (x) =>
    //     x.childId.isGifted != null &&
    //     x.childId.isGifted == EGIFTSTACKCOINSSETTING.ON
    // );
    // .then((data: any) => {
    //   data.teens.childId = {};
    //   console.log(data, "data");
    //   return data;
    // });
    return this.Ok(ctx, {
      data: internalTransferResponse.data.data.type.attributes["id"],
    });
  }
}

export default new WebHookController();
