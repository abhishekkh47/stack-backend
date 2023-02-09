import { UserBanksTable } from "./../../model/userBanks";
import { UserReferralTable } from "../../model/user-referral";
import { json } from "co-body";
import fs from "fs";
import moment from "moment";
import path from "path";
import envData from "../../config/index";
import { Auth, PrimeTrustJWT } from "../../middleware";
import {
  AdminTable,
  ParentChildTable,
  TransactionTable,
  UserTable,
  WebhookTable,
} from "../../model";
import {
  AuthService,
  DeviceTokenService,
  userService,
  zohoCrmService,
} from "../../services/v1/index";
import {
  EGIFTSTACKCOINSSETTING,
  ETransactionStatus,
  EUSERSTATUS,
  EUserType,
  HttpMethod,
} from "../../types";
import {
  checkValidBase64String,
  createAccount,
  getAccountStatusByAccountId,
  Route,
  uploadFilesFetch,
} from "../../utility";
import { NOTIFICATION, NOTIFICATION_KEYS } from "../../utility/constants";
import { validation } from "../../validations/v1/apiValidation";
import BaseController from "../base";
import { TradingService, UserService } from "../../services/v3/index";

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
    const jwtToken = ctx.request.primeTrustToken;
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
     * to get all the teen ids for the parent and self ids in case of self
     */
    let arrayForReferral = [];
    if (
      userExists.type === EUserType.PARENT &&
      checkAccountIdExists.teens.length > 0
    ) {
      checkAccountIdExists.teens.map((obj) =>
        arrayForReferral.push(obj.childId._id)
      );
    } else {
      arrayForReferral.push(checkAccountIdExists.firstChildId._id);
    }

    let getReferralSenderId = await UserReferralTable.findOne({
      "referralArray.referredId": { $in: arrayForReferral },
    });

    const userBankInfo = await UserBanksTable.findOne({
      userId: userExists._id,
    });

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
            Email: userExists.email,
            Account_Status: "2",
          };
          await zohoCrmService.addAccounts(
            ctx.request.zohoAccessToken,
            dataSentInCrm
          );

          await DeviceTokenService.sendUserNotification(
            userExists._id,
            NOTIFICATION_KEYS.KYC_FAILURE,
            NOTIFICATION.KYC_REJECTED_TITLE,
            null,
            null,
            userExists._id
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

            if (userBankInfo) {
              const parentChildDetails = await UserService.getParentChildInfo(
                userExists._id
              );

              const accountIdDetails =
                userExists.type == EUserType.PARENT && parentChildDetails
                  ? await parentChildDetails.teens.find(
                      (x: any) =>
                        x.childId.toString() ==
                        parentChildDetails.firstChildId.toString()
                    )
                  : parentChildDetails.accountId;

              /**
               * difference of 72 hours
               */
              const current = moment().unix();
              const difference = Math.ceil(
                moment
                  .duration(
                    moment
                      .unix(current)
                      .diff(moment.unix(parentChildDetails.unlockRewardTime))
                  )
                  .asMinutes()
              );

              if (Math.abs(difference) <= 4320) {
                if (
                  admin.giftCryptoSetting == EGIFTSTACKCOINSSETTING.ON &&
                  parentChildDetails &&
                  parentChildDetails.isGiftedCrypto == EGIFTSTACKCOINSSETTING.ON
                ) {
                  await TradingService.internalTransfer(
                    parentChildDetails,
                    jwtToken,
                    accountIdDetails,
                    userExists.type,
                    admin
                  );
                }
              }
            }
            /**
             * Update the status to zoho crm
             */
            let dataSentInCrm: any = {
              Account_Name: userExists.firstName + " " + userExists.lastName,
              Email: userExists.email,
              Account_Status: "3",
            };
            await zohoCrmService.addAccounts(
              ctx.request.zohoAccessToken,
              dataSentInCrm
            );

            await DeviceTokenService.sendUserNotification(
              userExists._id,
              NOTIFICATION_KEYS.KYC_SUCCESS,
              NOTIFICATION.KYC_APPROVED_TITLE,
              NOTIFICATION.KYC_APPROVED_DESCRIPTION,
              null,
              userExists._id
            );
            /**
             * Gift stack coins to all teens whose parent's kyc is approved
             */
            if (admin.giftStackCoinsSetting == EGIFTSTACKCOINSSETTING.ON) {
              let userIdsToBeGifted = [];

              /**
               * for user referral
               */

              getReferralSenderId &&
                (await userService.redeemUserReferral(
                  getReferralSenderId.userId,
                  arrayForReferral,
                  userExists.referralCode
                ));

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
                      Email: allTeen.childId.email,
                      Stack_Coins: admin.stackCoins,
                    };
                    await zohoCrmService.addAccounts(
                      ctx.request.zohoAccessToken,
                      dataSentInCrm
                    );
                  }
                }
              } else if (userExists.type === EUserType.SELF) {
                userIdsToBeGifted.push(userExists._id);

                /**
                 * Added in zoho
                 */
                let dataSentInCrm: any = {
                  Account_Name:
                    userExists.firstName + " " + userExists.lastName,
                  Email: userExists.email,
                  Stack_Coins: admin.stackCoins,
                };
                await zohoCrmService.addAccounts(
                  ctx.request.zohoAccessToken,
                  dataSentInCrm
                );
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

              if (userBankInfo) {
                const parentChildDetails = await UserService.getParentChildInfo(
                  userExists._id
                );

                const accountIdDetails =
                  userExists.type == EUserType.PARENT && parentChildDetails
                    ? await parentChildDetails.teens.find(
                        (x: any) =>
                          x.childId.toString() ==
                          parentChildDetails.firstChildId.toString()
                      )
                    : parentChildDetails.accountId;

                /**
                 * difference of 72 hours
                 */
                const current = moment().unix();
                const difference = Math.ceil(
                  moment
                    .duration(
                      moment
                        .unix(current)
                        .diff(moment.unix(parentChildDetails.unlockRewardTime))
                    )
                    .asMinutes()
                );

                if (Math.abs(difference) <= 4320) {
                  if (
                    admin.giftCryptoSetting == EGIFTSTACKCOINSSETTING.ON &&
                    parentChildDetails &&
                    parentChildDetails.isGiftedCrypto ==
                      EGIFTSTACKCOINSSETTING.ON
                  ) {
                    await TradingService.internalTransfer(
                      parentChildDetails,
                      jwtToken,
                      accountIdDetails,
                      userExists.type,
                      admin
                    );
                  }
                }
              }

              /**
               * Update the status to zoho crm
               */
              let dataSentInCrm: any = {
                Account_Name: userExists.firstName + " " + userExists.lastName,
                Email: userExists.email,
                Account_Status: "3",
              };
              await zohoCrmService.addAccounts(
                ctx.request.zohoAccessToken,
                dataSentInCrm
              );

              await DeviceTokenService.sendUserNotification(
                userExists._id,
                NOTIFICATION_KEYS.KYC_SUCCESS,
                NOTIFICATION.KYC_APPROVED_TITLE,
                NOTIFICATION.KYC_APPROVED_DESCRIPTION,
                null,
                userExists._id
              );
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

                /**
                 * for user referral
                 */
                getReferralSenderId &&
                  (await userService.redeemUserReferral(
                    getReferralSenderId.userId,
                    arrayForReferral,
                    userExists.referralCode
                  ));

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
                        Email: allTeen.childId.email,
                        Stack_Coins: admin.stackCoins,
                      };
                      await zohoCrmService.addAccounts(
                        ctx.request.zohoAccessToken,
                        dataSentInCrm
                      );
                    }
                  }
                } else if (userExists.type === EUserType.SELF) {
                  userIdsToBeGifted.push(userExists._id);

                  /**
                   * Added in zoho
                   */
                  let dataSentInCrm: any = {
                    Account_Name:
                      userExists.firstName + " " + userExists.lastName,
                    Email: userExists.email,
                    Stack_Coins: admin.stackCoins,
                  };
                  await zohoCrmService.addAccounts(
                    ctx.request.zohoAccessToken,
                    dataSentInCrm
                  );
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
          await DeviceTokenService.sendUserNotification(
            userExists._id,
            NOTIFICATION_KEYS.ACCOUNT_CLOSED,
            NOTIFICATION.ACCOUNT_CLOSED_TITLE,
            NOTIFICATION.ACCOUNT_CLOSED_DESCRIPTION,
            null,
            userExists._id
          );
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
            // Set our deposit status to settled
            await TransactionTable.updateOne(
              { _id: checkQuoteIdExistsDeposit._id },
              { $set: { status: ETransactionStatus.SETTLED } }
            );

            // Update user's `funded` status
            if (!userExists.funded) {
              // prevent unnecessary queries
              await UserTable.updateOne(
                { _id: userExists._id },
                { $set: { funded: true } }
              );

              let dataSentInCrm: any = {
                Account_Name: userExists.firstName + " " + userExists.lastName,
                Email: userExists.email,
                Funded: true,
              };

              await zohoCrmService.addAccounts(
                ctx.request.zohoAccessToken,
                dataSentInCrm
              );
            }

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

            if (!fs.existsSync(path.join(__dirname, "../../../uploads")))
              fs.mkdirSync(path.join(__dirname, "../../../uploads"));
            fs.writeFileSync(
              path.join(__dirname, "../../../uploads", imageName),
              decodedImage,
              "base64"
            );
            const accountIdDetails: any =
              userExists.type === EUserType.SELF
                ? parentChildExists
                : await parentChildExists.teens.find(
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
                path.join(__dirname, "../../../uploads", imageName)
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
              if (!fs.existsSync(path.join(__dirname, "../../../uploads"))) {
                fs.mkdirSync(path.join(__dirname, "../../../uploads"));
              }
              fs.writeFileSync(
                path.join(__dirname, "../../../uploads", imageName),
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
                  path.join(__dirname, "../../../uploads", fileData.filename)
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
}

export default new WebHookController();
