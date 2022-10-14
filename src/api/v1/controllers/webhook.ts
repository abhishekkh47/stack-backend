import { json } from "co-body";
import fs from "fs";
import moment from "moment";
import path from "path";
import envData from "../../../config/index";
import { Auth, PrimeTrustJWT } from "../../../middleware";
import {
  AdminTable,
  DeviceToken,
  Notification,
  ParentChildTable,
  StateTable,
  TransactionTable,
  UserActivityTable,
  UserTable,
  WebhookTable,
} from "../../../model";
import { AuthService, zohoCrmService } from "../../../services";
import {
  EAction,
  EGIFTSTACKCOINSSETTING,
  ERead,
  ERECURRING,
  EStatus,
  ETransactionStatus,
  ETransactionType,
  EUSERSTATUS,
  EUserType,
  HttpMethod,
  messages,
} from "../../../types";
import {
  checkValidBase64String,
  getAccountStatusByAccountId,
  getContactId,
  kycDocumentChecks,
  Route,
  sendNotification,
  updateContacts,
  uploadFilesFetch,
  createAccount,
  createContributions,
  getBalance,
} from "../../../utility";
import { NOTIFICATION, NOTIFICATION_KEYS } from "../../../utility/constants";
import { validation } from "../../../validations/apiValidation";
import BaseController from "./base";

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
      $or: [
        { "teens.accountId": body.account_id },
        { accountId: body.account_id },
      ],
    })
      .populate("teens.childId", [
        "email",
        "isGifted",
        "isGiftedCrypto",
        "firstName",
        "lastName",
      ])
      .populate("firstChildId", ["firstName", "lastName"])
      .populate("userId", ["firstName", "lastName"]);
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
          await zohoCrmService.addAccounts(
            ctx.request.zohoAccessToken,
            dataSentInCrm
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
            await zohoCrmService.addAccounts(
              ctx.request.zohoAccessToken,
              dataSentInCrm
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
              let userIdsToBeGifted = [];
              if (userExists.type == EUserType.PARENT) {
                let allTeens = await checkAccountIdExists.teens.filter(
                  (x) => x.childId.isGifted == EGIFTSTACKCOINSSETTING.OFF
                );
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
                    await zohoCrmService.addAccounts(
                      ctx.request.zohoAccessToken,
                      dataSentInCrm
                    );
                  }
                }
              } else if (userExists.isGifted == EGIFTSTACKCOINSSETTING.OFF) {
                userIdsToBeGifted.push(userExists._id);
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
              await zohoCrmService.addAccounts(
                ctx.request.zohoAccessToken,
                dataSentInCrm
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
              if (userExists.type == EUserType.PARENT) {
                let allChilds: any = await checkAccountIdExists.teens.filter(
                  (x) =>
                    checkAccountIdExists.firstChildId._id.toString() !=
                    x.childId._id.toString()
                );
                let contactId = checkAccountIdExists.contactId;
                if (allChilds.length > 0) {
                  let childArray = [];
                  for await (let allChild of allChilds) {
                    let childName = allChild.childId.lastName
                      ? allChild.childId.firstName +
                        " " +
                        allChild.childId.lastName
                      : allChild.childId.firstName;
                    const data = {
                      type: "account",
                      attributes: {
                        "account-type": "custodial",
                        name:
                          childName +
                          " - " +
                          checkAccountIdExists.userId.firstName +
                          " " +
                          checkAccountIdExists.userId.lastName +
                          " - " +
                          contactId,
                        "authorized-signature":
                          checkAccountIdExists.userId.firstName +
                          " - " +
                          checkAccountIdExists.userId.lastName,
                        "webhook-config": {
                          url: envData.WEBHOOK_URL,
                        },
                        "contact-id": contactId,
                      },
                    };
                    const createAccountData: any = await createAccount(
                      ctx.request.primeTrustToken,
                      data
                    );
                    if (createAccountData.status == 400) {
                      return this.BadRequest(ctx, createAccountData.message);
                    }
                    let bulWriteOperation = {
                      updateOne: {
                        filter: {
                          _id: checkAccountIdExists._id,
                          teens: {
                            $elemMatch: {
                              childId: allChild.childId._id,
                            },
                          },
                        },
                        update: {
                          $set: {
                            "teens.$.accountId": createAccountData.data.data.id,
                          },
                        },
                      },
                    };
                    await childArray.push(bulWriteOperation);
                  }
                  if (childArray.length > 0) {
                    await ParentChildTable.bulkWrite(childArray);
                  }
                }
              }
              /**
               * Gift stack coins to all teens whose parent's kyc is approved
               */
              if (admin.giftStackCoinsSetting == EGIFTSTACKCOINSSETTING.ON) {
                let userIdsToBeGifted = [];
                if (userExists.type == EUserType.PARENT) {
                  let allTeens = await checkAccountIdExists.teens.filter(
                    (x) => x.childId.isGifted == EGIFTSTACKCOINSSETTING.OFF
                  );
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
                      await zohoCrmService.addAccounts(
                        ctx.request.zohoAccessToken,
                        dataSentInCrm
                      );
                    }
                  }
                } else if (userExists.isGifted == EGIFTSTACKCOINSSETTING.OFF) {
                  userIdsToBeGifted.push(userExists._id);
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

            await AuthService.updateKycDocumentChecks(
              parentChildExists,
              jwtToken,
              frontDocumentId,
              backDocumentId,
              userExists
            );
          }

          await AuthService.updatePrimeTrustData(
            input,
            userExists,
            ctx.request.primeTrustToken
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
  @PrimeTrustJWT()
  public async testZoho(ctx: any) {
    let jwtToken = ctx.request.primeTrustToken;
    let users: any = await UserTable.aggregate([
      {
        $match: {
          $and: [
            { isRecurring: { $exists: true } },
            { isRecurring: { $nin: [0, 1] } },
          ],
        },
      },
      {
        $lookup: {
          from: "parentchild",
          localField: "_id",
          foreignField: "teens.childId",
          as: "parentChild",
        },
      },
      { $unwind: { path: "$parentChild", preserveNullAndEmptyArrays: true } },
    ]).exec();
    if (users.length > 0) {
      let todayDate = moment().startOf("day").unix();
      let transactionArray = [];
      let mainArray = [];
      let activityArray = [];
      for await (let user of users) {
        const accountIdDetails = await user.parentChild.teens.find(
          (x: any) => x.childId.toString() == user._id.toString()
        );
        if (!accountIdDetails) {
          continue;
        }
        let deviceTokenData = await DeviceToken.findOne({
          userId: user.parentChild.userId,
        }).select("deviceToken");
        let selectedDate = moment(user.selectedDepositDate)
          .startOf("day")
          .unix();
        if (selectedDate <= todayDate) {
          let contributionRequest = {
            type: "contributions",
            attributes: {
              "account-id": accountIdDetails.accountId,
              "contact-id": user.parentChild.contactId,
              "funds-transfer-method": {
                "funds-transfer-type": "ach",
                "ach-check-type": "personal",
                "contact-id": user.parentChild.contactId,
                "plaid-processor-token": user.parentChild.processorToken,
              },
              amount: user.selectedDeposit,
            },
          };
          let contributions: any = await createContributions(
            jwtToken,
            contributionRequest
          );
          if (contributions.status == 400) {
            /**
             * Notification
             */
            if (deviceTokenData) {
              let notificationRequest = {
                key:
                  contributions.code == 25001
                    ? NOTIFICATION_KEYS.RECURRING_FAILED_BANK
                    : NOTIFICATION_KEYS.RECURRING_FAILED_BALANCE,
                title: "Recurring Deposit Error",
                message:
                  contributions.code == 25001
                    ? NOTIFICATION.RECURRING_FAILED_BANK_ERROR
                    : NOTIFICATION.RECURRING_FAILED_INSUFFICIENT_BALANCE,
              };
              await sendNotification(
                deviceTokenData.deviceToken,
                notificationRequest.title,
                notificationRequest
              );
              await Notification.create({
                title: notificationRequest.title,
                userId: user.parentChild.userId,
                message: null,
                isRead: ERead.UNREAD,
                data: JSON.stringify(notificationRequest),
              });
            }
            continue;
          } else {
            let activityData = {
              userId: user._id,
              userType: EUserType.TEEN,
              message: `${messages.RECURRING_DEPOSIT} $${user.selectedDeposit}`,
              currencyType: null,
              currencyValue: user.selectedDeposit,
              action: EAction.DEPOSIT,
              resourceId: contributions.data.included[0].id,
              status: EStatus.PROCESSED,
            };
            await activityArray.push(activityData);
            let transactionData = {
              assetId: null,
              cryptoId: null,
              accountId: accountIdDetails.accountId,
              type: ETransactionType.DEPOSIT,
              recurringDeposit: true,
              settledTime: moment().unix(),
              amount: user.selectedDeposit,
              amountMod: null,
              userId: user._id,
              parentId: user.parentChild.userId,
              status: ETransactionStatus.PENDING,
              executedQuoteId: contributions.data.included[0].id,
              unitCount: null,
            };
            await transactionArray.push(transactionData);
            let bulWriteOperation = {
              updateOne: {
                filter: { _id: user._id },
                update: {
                  $set: {
                    selectedDepositDate: moment(user.selectedDepositDate)
                      .utc()
                      .startOf("day")
                      .add(
                        user.isRecurring == ERECURRING.WEEKLY
                          ? 7
                          : user.isRecurring == ERECURRING.MONTLY
                          ? 1
                          : user.isRecurring == ERECURRING.DAILY
                          ? 24
                          : 0,
                        user.isRecurring == ERECURRING.WEEKLY
                          ? "days"
                          : user.isRecurring == ERECURRING.MONTLY
                          ? "months"
                          : user.isRecurring == ERECURRING.DAILY
                          ? "hours"
                          : "day"
                      ),
                  },
                },
              },
            };
            await mainArray.push(bulWriteOperation);
          }
          // }
        }
      }
      await UserActivityTable.insertMany(activityArray);
      await TransactionTable.insertMany(transactionArray);
      await UserTable.bulkWrite(mainArray);
      return this.Ok(ctx, { message: "Added" });
    }
    return this.BadRequest(ctx, "No such user");
  }
}

export default new WebHookController();
