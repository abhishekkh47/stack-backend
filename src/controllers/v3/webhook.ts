import envData from "@app/config/index";
import { PrimeTrustJWT } from "@app/middleware";
import {
  AdminTable,
  ParentChildTable,
  TransactionTable,
  UserBanksTable,
  UserReferralTable,
  UserTable,
  WebhookTable,
} from "@app/model";
import { DeviceTokenService, zohoCrmService } from "@app/services/v1/index";
import {
  EGIFTSTACKCOINSSETTING,
  ETransactionStatus,
  EUSERSTATUS,
  EUserType,
  HttpMethod,
} from "@app/types";
import {
  createAccount,
  getAccountStatusByAccountId,
  Route,
  ANALYTICS_EVENTS,
} from "@app/utility";
import moment from "moment";
import BaseController from "@app/controllers/base";
import { AnalyticsService } from "@app/services/v4";

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
          body.data?.["kyc_required_actions"] &&
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
          return this.Ok(ctx, { message: "User Kyc Failed" });
        }
        /**
         * Success phases
         */
        if (
          body.data?.["changes"]?.length > 0 &&
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
              Email: userExists.email,
              Account_Status: "3",
            };
            await zohoCrmService.addAccounts(
              ctx.request.zohoAccessToken,
              dataSentInCrm
            );

            AnalyticsService.sendEvent(
              ANALYTICS_EVENTS.PARENT_KYC_APPROVED,
              undefined,
              {
                user_id: checkAccountIdExists.firstChildId._id,
              }
            );
            AnalyticsService.sendEvent(
              ANALYTICS_EVENTS.KYC_APPROVED,
              undefined,
              {
                user_id: checkAccountIdExists.userId._id,
              }
            );

            /**
             * Gift stack coins to all teens whose parent's kyc is approved
             */
            if (admin.giftStackCoinsSetting == EGIFTSTACKCOINSSETTING.ON) {
              let userIdsToBeGifted = [];
              if (userExists.type == EUserType.PARENT) {
                let allTeens = checkAccountIdExists.teens.filter(
                  (x) => x.childId.isGifted == EGIFTSTACKCOINSSETTING.OFF
                );
                if (allTeens.length > 0) {
                  for (let allTeen of allTeens) {
                    userIdsToBeGifted.push(allTeen.childId._id);
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

              AnalyticsService.sendEvent(
                ANALYTICS_EVENTS.PARENT_KYC_APPROVED,
                undefined,
                {
                  user_id: checkAccountIdExists.firstChildId._id,
                }
              );
              AnalyticsService.sendEvent(
                ANALYTICS_EVENTS.KYC_APPROVED,
                undefined,
                {
                  user_id: checkAccountIdExists.userId._id,
                }
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
}

export default new WebHookController();
