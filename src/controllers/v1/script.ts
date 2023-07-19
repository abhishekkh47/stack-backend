import { EPHONEVERIFIEDSTATUS } from "@app/types/user";
import { DripshopReedemTable } from "@app/model/dripshop";
import moment from "moment";
import { InternalUserAuth, PrimeTrustJWT } from "@app/middleware";
import {
  CryptoPriceTable,
  CryptoTable,
  DeviceToken,
  Notification,
  QuizQuestionTable,
  QuizQuestionResult,
  QuizResult,
  UserActivityTable,
  UserBanksTable,
  UserGiftCardTable,
  UserTable,
  TransactionTable,
  ParentChildTable,
  UserDraftTable,
  QuizTopicTable,
  QuizTable,
  DeletedUserTable,
  AdminTable,
  DripshopItemTable,
} from "@app/model";
import {
  EAction,
  EStatus,
  ETransactionStatus,
  ETransactionType,
  EUserType,
  HttpMethod,
} from "@app/types";
import {
  getAllGiftCards,
  getAssets,
  getPrimeTrustJWTToken,
  Route,
  getQuoteInformation,
  getInternalTransferInformation,
  getQuizImageAspectRatio,
  getBalance,
  GIFTCARDS,
  NOTIFICATION,
  NOTIFICATION_KEYS,
} from "@app/utility";
import BaseController from ".././base";
import {
  UserDBService,
  zohoCrmService,
  DeviceTokenService,
  ScriptService,
  tradingService,
  AuthService,
  DripshopDBService,
} from "@app/services/v1";
import { UserService } from "@app/services/v3";
import userDbService from "@app/services/v4/user.db.service";
import quizDbService from "@app/services/v4/quiz.db.service";
import userService from "@app/services/v2/user.service";
import envData from "@app/config";

class ScriptController extends BaseController {
  /**
   * @description This method is for updating screen status by script for migration into production
   * @param ctx
   * @returns
   */
  @Route({ path: "/update-screen-status-script", method: HttpMethod.POST })
  @InternalUserAuth()
  public async updateScreenStatusScript(ctx: any) {
    const reqParam = ctx.request.body;
    const { email } = reqParam;

    const attachEmail_Parent = (query) => ({
      $and: email
        ? [query, { type: { $not: { $eq: EUserType.TEEN } } }, { email }]
        : [query, { type: EUserType.PARENT }],
    });

    const attachEmail_Teen = (query) => ({
      $and: email
        ? [query, { type: EUserType.TEEN }, { email }]
        : [query, { type: EUserType.PARENT }],
    });

    const updatedCountParent2 = await UserTable.updateMany(
      attachEmail_Parent({ screenStatus: 1 }),
      {
        $set: {
          screenStatus: 5,
        },
      }
    );
    const updatedCountParent1 = await UserTable.updateMany(
      attachEmail_Parent({ screenStatus: 0 }),
      {
        $set: {
          screenStatus: 1,
        },
      }
    );
    const updatedCountParent3 = await UserTable.updateMany(
      attachEmail_Parent({ screenStatus: 2 }),
      {
        $set: {
          screenStatus: 6,
        },
      }
    );
    const updatedCountParent4 = await UserTable.updateMany(
      attachEmail_Parent({ screenStatus: 3 }),
      {
        $set: {
          screenStatus: 7,
        },
      }
    );
    const updatedCountTeen1 = await UserTable.updateMany(
      attachEmail_Teen({ screenStatus: 0 }),
      {
        $set: {
          screenStatus: 10,
        },
      }
    );
    return this.Ok(ctx, {
      updatedCountParent1,
      updatedCountParent2,
      updatedCountParent3,
      updatedCountParent4,
      updatedCountTeen1,
    });
  }

  /**
   * @description This method is for deleting user created before 30 days
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/delete-data-after-30d", method: HttpMethod.POST })
  @InternalUserAuth()
  public async deleteDataAfter30D(ctx: any) {
    let dateBefore30Days = new Date(Date.now() - 60 * 60 * 24 * 30 * 1000); // 30 days before date
    const findQuery = {
      createdAt: {
        $lte: dateBefore30Days,
      },
    };

    // get all the users to get the criterion of 30 days date
    let getAllUsersBefore30Days = await UserTable.find(findQuery, { _id: 1 });

    //add the userId criterion to the condition
    let queryToGetPurgeData = {
      userId: { $in: getAllUsersBefore30Days },
    };

    /**
     * get the data from teh collections based on query
     * will bring data before 30 days
     */
    let getAllUsersBefore30D = await UserTable.find(findQuery);

    /**
     * delete the records based on query
     */
    await UserTable.deleteMany(findQuery);
    await UserBanksTable.deleteMany(queryToGetPurgeData);
    await DeviceToken.deleteMany(queryToGetPurgeData);
    await Notification.deleteMany(queryToGetPurgeData);
    await ParentChildTable.deleteMany(queryToGetPurgeData);
    await QuizQuestionResult.deleteMany(queryToGetPurgeData);
    await QuizResult.deleteMany(queryToGetPurgeData);
    await TransactionTable.deleteMany(queryToGetPurgeData);
    await UserActivityTable.deleteMany(queryToGetPurgeData);

    return this.Ok(ctx, {
      message: "successfull",
      userIds: getAllUsersBefore30D,
      count: getAllUsersBefore30D.length,
    });
  }

  /**
   * @description This method is used to test redeeming of gift card
   * @param ctx
   * @return {*}
   */
  @Route({ path: "/add-gift-card", method: HttpMethod.POST })
  @InternalUserAuth()
  public async addGiftCard(ctx: any) {
    let token = await getPrimeTrustJWTToken();
    const crypto = await CryptoTable.findOne({ symbol: "BTC" });

    /**
     * to get all the gift cards from shopify
     */
    let allGiftCards: any = await getAllGiftCards(
      GIFTCARDS.page,
      GIFTCARDS.limit
    );

    /**
     * to get already existing uuids
     */
    let giftCardArray = [];
    let getAllUUIDs = await UserGiftCardTable.find({}, { uuid: 1, _id: 0 });

    /**
     * enter all the new data in an array
     */
    if (allGiftCards?.data && allGiftCards?.data.length > 0) {
      for await (let card of allGiftCards?.data) {
        if (!getAllUUIDs.some((obj: any) => obj.uuid === card.uuid)) {
          giftCardArray.push({
            uuid: card.uuid,
            sender_name: card.message_from,
            sender_email: card.customer_email,
            recieptent_email: card.recipient_email,
            issued_giftcard_order_id: card.issued_gift_card_id,
            send_on_date: card.send_on,
            message_text: card.message_text,
            amount: card.amount,
            recipient_phone: card.recipient_phone,
            reedemed: false,
          });
        }
      }
    }

    await UserGiftCardTable.insertMany(giftCardArray);

    /**
     * to get all the emails
     * map to get only emails array and not array of objects
     */
    let getEmailAllUsers = await UserTable.find(
      {},
      { _id: 0, email: 1, type: 1, status: 1 }
    );
    let onlyEmailsArray = getEmailAllUsers.map((obj: any) => obj.email);

    /**
     * get the required status, email and send on date, etc to check further
     */
    let getRequiredGiftInfo = await UserGiftCardTable.find(
      {
        $and: [
          { recieptent_email: { $in: onlyEmailsArray } },
          { redeemed: false },
        ],
      },
      {
        redeemed: 1,
        recieptent_email: 1,
        send_on_date: 1,
        _id: 0,
        uuid: 1,
        amount: 1,
        sender_name: 1,
      }
    );

    /**
     * condition of date to check whether add or not
     */
    let todayDate, dateToSend;
    if (getRequiredGiftInfo && getRequiredGiftInfo.length > 0) {
      let pushTransactionArray = [];
      let pushUserActivityArray = [];
      let notificationArray = [];
      let uuidArray = [];
      todayDate = moment().utc().startOf("day").unix(); // today's date
      for await (let getDate of getRequiredGiftInfo) {
        dateToSend = moment(getDate.send_on_date).utc().startOf("day").unix(); // date to send the card on

        if (dateToSend <= todayDate) {
          /**
           * to check kyc approved or not and also get the userId and childId
           */
          let kycApproved: any = await userService.getKycApproved(
            getDate.recieptent_email
          );

          if (kycApproved.status) {
            /**
             * used to do internal transfer for the given amount
             */
            let internalTranfser = await tradingService.internalTransferAction(
              kycApproved.userId,
              kycApproved.childId,
              token.data,
              getDate.amount
            );

            if (internalTranfser.giftCardStatus) {
              /**
               * array containing all transactions
               */
              pushTransactionArray.push({
                status: ETransactionStatus.SETTLED,
                userId: kycApproved.childId,
                executedQuoteId: internalTranfser.internalTransferId,
                unitCount: internalTranfser.executedQuoteUnitCount,
                accountId: internalTranfser.accountId,
                amountMod: -getDate.amount,
                amount: getDate.amount,
                settledTime: moment().unix(),
                cryptoId: crypto._id,
                assetId: crypto.assetId,
                type: ETransactionType.BUY,
              });

              /**
               * array containing all the activities
               */
              pushUserActivityArray.push({
                userId: kycApproved.childId,
                userType: kycApproved.type,
                message: NOTIFICATION.GIFT_CARD_ACITVITY_MESSAGE.replace(
                  "{amount}",
                  getDate.amount.toString()
                ).replace("{sender}", getDate.sender_name),
                currencyType: null,
                currencyValue: getDate.amount,
                action: EAction.BUY_CRYPTO,
                status: EStatus.PROCESSED,
                cryptoId: crypto._id,
                assetId: crypto.assetId,
              });

              /**
               * for push notification
               */
              await DeviceTokenService.sendUserNotification(
                kycApproved.childId,
                NOTIFICATION_KEYS.GIFT_CARD_ISSUED,
                NOTIFICATION.GIFT_CARD_REDEEMED,
                NOTIFICATION.GIFT_CARD_REDEEM_MESSAGE.replace(
                  "{amount}",
                  getDate.amount.toString()
                ).replace("{sender}", getDate.sender_name)
              );
            }
            uuidArray.push(getDate.uuid);
          }
        }
      }

      /**
       * update and insert the db with data
       */
      await UserGiftCardTable.updateMany(
        { uuid: { $in: uuidArray } },

        {
          $set: {
            redeemed: true,
          },
        }
      );
      await TransactionTable.insertMany(pushTransactionArray);
      await UserActivityTable.insertMany(pushUserActivityArray);
      await Notification.insertMany(notificationArray);
    }

    return this.Ok(ctx, {
      data: allGiftCards,
    });
  }

  /**
   * @description This method is used to add the total quiz coins to userTable
   * @param ctx
   * @return {*}
   */
  @Route({ path: "/add-quiz-coins", method: HttpMethod.POST })
  @InternalUserAuth()
  public async addQuizCoins(ctx: any) {
    let allQuizCoinData = await QuizResult.aggregate([
      {
        $group: {
          _id: "$userId",
          sum: {
            $sum: "$pointsEarned",
          },
        },
      },
      {
        $project: {
          sum: 1,
        },
      },
    ]).exec();

    let mainArray = allQuizCoinData.map((quizCoin) => {
      return {
        updateOne: {
          filter: { _id: quizCoin._id },
          update: {
            $set: {
              quizCoins: quizCoin.sum,
            },
          },
        },
      };
    });

    const updatedData = await UserTable.bulkWrite(mainArray);
    return this.Ok(ctx, { message: "success", updatedData });
  }

  /**
   * 1 get user detail
   * quiz detail
   * parentchild relation
   */

  /**
   * @description This method is used to sunc db and Zoho CRM data
   * @param ctx
   * @return  {*}
   */
  @Route({ path: "/add-userdata-to-crm", method: HttpMethod.POST })
  @InternalUserAuth()
  @PrimeTrustJWT(true)
  public async addUserDataToCrm(ctx: any) {
    /**
     * service to find all info of users
     */
    let allUsersInfo = await UserDBService.getAllUsersInfo();

    /**
     * service to get the user data to add in crm
     */
    let dataSentInCrm = await zohoCrmService.getDataSentToCrm(allUsersInfo);

    const zohoCrmObjectSize = 90;
    let crmObject;
    for (let i = 0; i < dataSentInCrm.length; i += zohoCrmObjectSize) {
      crmObject = dataSentInCrm.slice(i, i + zohoCrmObjectSize);

      /**
       * add account to zoho crm
       */
      await zohoCrmService.addAccounts(
        ctx.request.zohoAccessToken,
        crmObject,
        true
      );
    }

    return this.Ok(ctx, { message: "Success", dataSentInCrm });
  }

  /**
   * @description KYC Approve a staging account in PrimeTrust sandbox
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/staging/kyc-approve-user/:userId", method: HttpMethod.POST })
  @InternalUserAuth()
  @PrimeTrustJWT(false)
  public async kycApproveStaging(ctx: any) {
    const { primeTrustToken } = ctx.request;
    const { userId } = ctx.request.params;
    const kycApprove = await ScriptService.sandboxApproveKYC(
      userId,
      primeTrustToken
    );
    if (kycApprove.status !== 200)
      return this.BadRequest(ctx, kycApprove.message);

    return this.Ok(ctx, {
      status: kycApprove.status,
      message: kycApprove.message,
    });
  }

  /**
   * @description This method is used to add phone verification status
   * @param ctx
   * @return {*}
   */
  @Route({ path: "/add-phone-verification-status", method: HttpMethod.POST })
  @InternalUserAuth()
  public async addPhoneVerificationStatus(ctx: any) {
    const allUserInfo = await UserTable.find();
    let userToUpdateStatus = allUserInfo.map((user) => {
      if (user.email && user.mobile) {
        return user._id.toString();
      }
    });

    userToUpdateStatus = userToUpdateStatus.filter((i) => i);

    await UserTable.updateMany(
      {
        _id: {
          $in: userToUpdateStatus,
        },
      },
      {
        $set: {
          isPhoneVerified: EPHONEVERIFIEDSTATUS.TRUE,
        },
      }
    );
    return this.Ok(ctx, { allUserInfo });
  }

  /**
   * @description This script is used to add questions for the on boarding quiz
   * @param ctx
   * @return {*}
   */
  @Route({ path: "/add-onboarding-quiz", method: HttpMethod.POST })
  @InternalUserAuth()
  public async addOnboardingQuiz(ctx: any) {
    const reqParam = ctx.request.body;
    await QuizQuestionTable.insertMany(reqParam.onboardingQuizData);
    return this.Ok(ctx, { quizData: reqParam.onboardingQuizData });
  }
  /*
   * @description This method is used to unset fields in db
   * @param ctx
   * @return {*}
   */
  @Route({ path: "/unset-fields-in-db", method: HttpMethod.POST })
  @InternalUserAuth()
  public async unsetFieldsInDb(ctx: any) {
    /**
     * Clean up user fields , userdraft fields and  parent child table
     */
    await UserTable.updateMany(
      {},
      {
        $unset: {
          username: 1,
          password: 1,
          tempPassword: 1,
          loginAttempts: 1,
          liquidAsset: 1,
          verificationCode: 1,
          verificationEmailExpireAt: 1,
        },
      }
    );

    await UserDraftTable.updateMany(
      {},
      {
        $unset: {
          referralCode: 1,
          phoneNumber: 1,
          refreshToken: 1,
          parentNumber: 1,
        },
      }
    );
    await ParentChildTable.updateMany(
      {},
      {
        $unset: {
          accessToken: 1,
          processorToken: 1,
          institutionId: 1,
        },
      }
    );
    return this.Ok(ctx, { message: "Fields removed successfully" });
  }

  /**
   * @description This script is used to delete the data for self users and remove the data containing email, dob, type or any one of these entities as null
   * @param ctx
   * @return {*}
   */
  @Route({ path: "/delete-userdraft-data", method: HttpMethod.DELETE })
  @InternalUserAuth()
  public async deleteUserdraftSelfData(ctx: any) {
    const deleteDataQuery = {
      $or: [{ type: { $in: [null, 3] } }, { email: null }, { dob: null }],
    };
    const getUserData = await UserDraftTable.aggregate([
      {
        $match: deleteDataQuery,
      },
    ]);

    await UserDraftTable.deleteMany(deleteDataQuery);
    return this.Ok(ctx, { data: getUserData });
  }

  /**
   * @description script to migrate teen data from userdraft to user table
   * @param ctx
   * @return {*}
   */
  @Route({
    path: "/migrate-teen-data",
    method: HttpMethod.POST,
  })
  @InternalUserAuth()
  public async migrateTeenDatatoUser(ctx: any) {
    const getTeenUserdraftData = await UserDraftTable.find({
      type: EUserType.TEEN,
    });

    const allUserDraftEmails = getTeenUserdraftData
      .map((i) => i.email)
      .filter((i) => i);
    const allUserDraftMobile = getTeenUserdraftData
      .map((i) => i.mobile)
      .filter((i) => i);

    const getAllUserDataForEmail = await UserTable.find({
      email: { $in: allUserDraftEmails },
    });

    const getAllUserDataForMobile = await UserTable.find({
      mobile: { $in: allUserDraftMobile },
    });

    getTeenUserdraftData.map((m: any, index: number) => {
      getTeenUserdraftData[index] = {
        ...m._doc,
        isOnboardingQuizCompleted: true,
      };
    });

    let teenArray: any = getTeenUserdraftData;
    if (getAllUserDataForEmail && getAllUserDataForEmail.length > 0) {
      teenArray = getTeenUserdraftData.filter((teenUser: any) => {
        if (teenUser.email) {
          if (
            !getAllUserDataForEmail.some((user) => user.email == teenUser.email)
          ) {
            return teenUser;
          }
        }
      });
    }

    if (getAllUserDataForMobile && getAllUserDataForMobile.length > 0) {
      const teenData = teenArray.length > 0 ? teenArray : getTeenUserdraftData;
      teenArray = teenData.filter((teenUser: any) => {
        if (
          !getAllUserDataForMobile.some(
            (user) => user.mobile == teenUser.mobile
          )
        ) {
          return teenUser;
        }
      });
    }

    teenArray = teenArray.map((user) => {
      return {
        email: user.email,
        mobile: user.mobile,
        type: user.type,
        dob: user.dob,
        isOnboardingQuizCompleted: user.isOnboardingQuizCompleted,
        firstName: user.firstName,
        lastName: user.lastName,
        isPhoneVerified: user.mobile ? 1 : 0,
      };
    });

    await UserTable.insertMany(teenArray);
    await UserDraftTable.deleteMany({
      type: EUserType.TEEN,
    });

    return this.Ok(ctx, {
      data: teenArray,
      emailData: getAllUserDataForEmail,
      mobileData: getAllUserDataForMobile,
    });
  }

  /**
   * @description script to migrate parent record from userdraft to user
   * @param ctx
   * @return {*}
   */
  @Route({
    path: "/migrate-parent-data",
    method: HttpMethod.POST,
  })
  @InternalUserAuth()
  public async migrateParentDatatoUser(ctx: any) {
    const getAllParentData = await UserDraftTable.find({
      type: EUserType.PARENT,
    });

    const allUserDraftEmails = getAllParentData
      .map((i) => i.email)
      .filter((i) => i);
    const allUserDraftMobile = getAllParentData
      .map((i) => i.mobile)
      .filter((i) => i);

    const getAllUserDataForEmail = await UserTable.find({
      email: { $in: allUserDraftEmails },
    });

    const getAllUserDataForMobile = await UserTable.find({
      mobile: { $in: allUserDraftMobile },
    });

    const checkTeenExists = await UserTable.find({
      $and: [
        { parentEmail: { $in: allUserDraftEmails } },
        {
          parentMobile: { $in: allUserDraftMobile },
        },
      ],
    });

    let parentArray: any = getAllParentData;

    if (getAllUserDataForEmail && getAllUserDataForEmail.length > 0) {
      parentArray = getAllParentData.filter((parentUser: any) => {
        if (parentUser.email) {
          if (
            !getAllUserDataForEmail.some(
              (user) => user.email == parentUser.email
            )
          ) {
            return parentUser;
          }
        }
      });
    }

    if (getAllUserDataForMobile && getAllUserDataForMobile.length > 0) {
      const parentData =
        parentArray.length > 0 ? parentArray : getAllParentData;
      parentArray = parentData.filter((parentUser: any) => {
        if (
          !getAllUserDataForMobile.some(
            (user) => user.mobile == parentUser.mobile
          )
        ) {
          return parentUser;
        }
      });
    }

    if (checkTeenExists && checkTeenExists.length > 0) {
      for await (let getParents of getAllParentData) {
        for await (let teens of checkTeenExists) {
          if (
            teens.parentEmail === getParents.email &&
            teens.parentMobile === getParents.mobile
          ) {
            let teenExistsInParentChild = await ParentChildTable.findOne({
              "teens.childId": teens._id,
            });
            if (!teenExistsInParentChild) {
              const getParentsId: any = await UserTable.create({
                email: getParents.email,
                mobile: getParents.mobile,
                type: getParents.type,
                dob: getParents.dob,
                firstName: getParents.firstName,
                lastName: getParents.lastName,
                isPhoneVerified: getParents.mobile ? 1 : 0,
              });
              const parentExistsInParentChild = await ParentChildTable.findOne({
                userId: getParentsId._id,
              });

              parentArray = parentArray.filter(
                (user) => user.email != getParents.email
              );

              if (parentExistsInParentChild) {
                await ParentChildTable.updateOne(
                  {
                    _id: parentExistsInParentChild._id,
                  },
                  {
                    $push: {
                      teens: {
                        childId: teens._id,
                        accountId: null,
                      },
                    },
                  }
                );
              } else {
                await ParentChildTable.findOneAndUpdate(
                  {
                    userId: getParentsId._id,
                  },
                  {
                    $set: {
                      contactId: null,
                      firstChildId: teens._id,
                      teens: [{ childId: teens._id, accountId: null }],
                    },
                  },
                  { upsert: true, new: true }
                );
              }
            } else {
              continue;
            }
          }
        }
      }
    }

    parentArray = parentArray.map((user) => {
      return {
        email: user.email,
        mobile: user.mobile,
        type: user.type,
        dob: user.dob,
        firstName: user.firstName,
        lastName: user.lastName,
        isPhoneVerified: user.mobile ? 1 : 0,
      };
    });

    await UserTable.insertMany(parentArray);
    await UserDraftTable.deleteMany({
      type: EUserType.PARENT,
    });

    return this.Ok(ctx, {
      data: parentArray,
      emailData: getAllUserDataForEmail,
      mobileData: getAllUserDataForMobile,
    });
  }

  /**
   * @description This script is used to delete whole data by taking userId as input
   * @param ctx
   * @returns
   */
  @Route({ path: "/delete-data", method: HttpMethod.POST })
  @InternalUserAuth()
  @PrimeTrustJWT(true)
  public async deleteDataFromDB(ctx: any) {
    const userId = ctx.request.body.userId;
    const { zohoAccessToken, primeTrustToken } = ctx.request;
    let userExists = await UserTable.findOne({ _id: userId });
    if (!userId || !userExists) {
      return this.BadRequest(ctx, "User Details Not Found");
    }
    const isDetailsDeleted = await UserService.deleteUserData(
      userExists,
      zohoAccessToken,
      primeTrustToken
    );
    if (!isDetailsDeleted) {
      return this.BadRequest(ctx, "Error in deleting account");
    }

    return this.Ok(ctx, { message: "Data removed successfully" });
  }

  /**
   * @description This script is used to update the isOnboardingQuizCompleted for old users
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/update-onboardingquiz-status", method: HttpMethod.POST })
  @InternalUserAuth()
  public async updateOnboardingQuizStatus(ctx: any) {
    await UserTable.updateMany(
      {
        type: EUserType.TEEN,
      },
      {
        $set: {
          isOnboardingQuizCompleted: true,
        },
      }
    );
    return this.Ok(ctx, { message: "Success" });
  }

  /**
   * @description This method is used
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/portfolio-asset-fix", method: HttpMethod.POST })
  @InternalUserAuth()
  @PrimeTrustJWT(true)
  public async fixPortfolioAssetBalance(ctx: any) {
    let jwtToken = ctx.request.primeTrustToken;
    const userExists = await UserTable.findOne({
      email: "nataliezx2010@gmail.com",
    });
    const parentChildExists: any = await ParentChildTable.findOne({
      "teens.childId": userExists._id,
    });
    if (!userExists || !parentChildExists) {
      return this.BadRequest(ctx, "User not found");
    }
    let accountDetails = parentChildExists.teens.find(
      (x) => x.childId.toString() === userExists._id.toString()
    );
    if (!accountDetails) {
      return this.BadRequest(ctx, "Account Details Not Found");
    }
    const accountId = accountDetails.accountId;
    let transactionDetails = await TransactionTable.find({
      userId: userExists._id,
      type: {
        $in: [ETransactionType.BUY, ETransactionType.SELL],
      },
    });
    let transactionIdsToBeRemoved = [];
    let validTransactions = [];
    let resouceNotFoundTransactions = [];
    for await (let transactions of transactionDetails) {
      let quoteDetails = await getQuoteInformation(
        jwtToken,
        transactions.executedQuoteId
      );
      if (
        quoteDetails &&
        quoteDetails.data &&
        quoteDetails.data.relationships["initiator-account"] &&
        quoteDetails.data.relationships["initiator-account"].links &&
        quoteDetails.data.relationships["initiator-account"].links.related
      ) {
        let accountIdExtractFromPt =
          quoteDetails.data.relationships[
            "initiator-account"
          ].links.related.split("/v2/accounts/").length > 1
            ? quoteDetails.data.relationships[
                "initiator-account"
              ].links.related.split("/v2/accounts/")[1]
            : "";
        if (accountIdExtractFromPt !== accountId) {
          transactionIdsToBeRemoved.push(transactions._id);
        } else {
          validTransactions.push(transactions._id);
        }
      } else {
        resouceNotFoundTransactions.push(transactions);
      }
    }
    for await (let resouceNotFoundTransaction of resouceNotFoundTransactions) {
      let internalTransferDetails = await getInternalTransferInformation(
        jwtToken,
        resouceNotFoundTransaction.executedQuoteId
      );
      if (
        internalTransferDetails &&
        internalTransferDetails.data &&
        internalTransferDetails.data.relationships["to-account"] &&
        internalTransferDetails.data.relationships["to-account"].links &&
        internalTransferDetails.data.relationships["to-account"].links.related
      ) {
        let accountIdExtractFromPt =
          internalTransferDetails.data.relationships[
            "to-account"
          ].links.related.split("/v2/accounts/").length > 1
            ? internalTransferDetails.data.relationships[
                "to-account"
              ].links.related.split("/v2/accounts/")[1]
            : "";
        if (accountIdExtractFromPt !== accountId) {
          transactionIdsToBeRemoved.push(resouceNotFoundTransaction._id);
        } else {
          validTransactions.push(resouceNotFoundTransaction._id);
        }
      }
    }
    await TransactionTable.deleteMany({
      _id: { $in: transactionIdsToBeRemoved },
    });
    return this.Ok(ctx, {
      message: "Success",
      data: transactionIdsToBeRemoved,
      validData: validTransactions,
      unsuedDataLength: transactionIdsToBeRemoved.length,
    });
  }

  /**
   * @description This method is used to add new 1.9 quiz topics
   * @param ctx
   */
  @Route({ path: "/add-quiz-topics", method: HttpMethod.POST })
  @InternalUserAuth()
  public async addQuizTopics(ctx: any) {
    try {
      const reqBody = ctx.request.body;
      const isFieldsAdded = reqBody.data.every((x) => x.topic && x.image);
      if (!isFieldsAdded) {
        return this.BadRequest(ctx, "Request Body not valid");
      }
      const quizTopicsData = await Promise.all(
        await reqBody.data.map(async (items) => {
          const quizTopicObject = {
            topic: items.topic,
            type: 2,
            image: items.image,
            status: 1,
          };
          const createdQuizTopicData = await QuizTopicTable.create(
            quizTopicObject
          );
          const quizObject = {
            quizName: items.quizTitle,
            topicId: createdQuizTopicData._id,
            videoUrl: null,
            image: items.quizImage,
          };
          const createdQuizData = await QuizTable.create(quizObject);
          return items;
        })
      );
      return this.Ok(ctx, { message: "Success" });
    } catch (error) {
      return this.BadRequest(ctx, "Something Went Wrong");
    }
  }

  /**
   * @description This method is used to add default reminder status
   * @param ctx
   */
  @Route({ path: "/add-default-reminder-status", method: HttpMethod.POST })
  @InternalUserAuth()
  public async addDefaultReminderStatus(ctx: any) {
    try {
      const updatedData = await UserTable.updateMany(
        {},
        {
          $set: {
            isParentOnboardingReminderSent: false,
            isQuizReminderNotificationSent: false,
          },
        }
      );
      return this.Ok(ctx, { data: updatedData });
    } catch (error) {
      return this.BadRequest(ctx, "Something Went Wrong");
    }
  }

  /**
   * @description This method is used to store new 1.10 new quiz content
   * @param ctx
   */
  @Route({ path: "/quiz-content", method: HttpMethod.POST })
  @InternalUserAuth()
  public async storeQuizContent(ctx: any) {
    try {
      const { quizNums } = ctx.request.body;
      if (quizNums.length === 0) {
        return this.BadRequest(ctx, "Please enter input quiz numbers");
      }
      let investingTopic = await QuizTopicTable.findOne({ topic: "Investing" });
      let allTopics = await QuizTopicTable.find({ type: 2, status: 1 }).select(
        "_id topic"
      );
      /**
       * Read Spreadsheet
       */
      const rows = await ScriptService.readSpreadSheet();
      /**
       * Convert Spreadsheet to JSON
       */
      const quizContentData = await ScriptService.convertSpreadSheetToJSON(
        investingTopic._id,
        quizNums,
        rows,
        allTopics
      );
      if (quizContentData.length === 0) {
        return this.BadRequest(ctx, "Quiz Content Not Found");
      }
      const isAddedToDb = await ScriptService.addQuizContentsToDB(
        quizContentData
      );
      if (!isAddedToDb) {
        return this.BadRequest(ctx, "Something Went Wrong");
      }
      return this.Ok(ctx, { message: "Success", data: quizContentData });
    } catch (error) {
      console.log(error);
      return this.BadRequest(ctx, "Something Went Wrong");
    }
  }

  /**
   * @description This method is used to store new 1.10 new quiz content
   * @param ctx
   */
  @Route({ path: "/import-quiz-category", method: HttpMethod.POST })
  @InternalUserAuth()
  public async storeQuizCategory(ctx: any) {
    try {
      const rows = await ScriptService.readSpreadSheet(
        envData.CATEGORY_SHEET_GID
      );
      const { isAddedToDB, data }: any =
        await ScriptService.addQuizCategoryContentsToDB(rows);
      if (!isAddedToDB) {
        return this.BadRequest(ctx, "Something Went Wrong");
      }

      return this.Ok(ctx, { message: "Success", data });
    } catch (error) {
      return this.BadRequest(ctx, "Something Went Wrong");
    }
  }

  /**
   * @description This method is used to get prime trust balance from user emails
   * @param ctx
   */
  @Route({ path: "/get-prime-trust-balance", method: HttpMethod.POST })
  @InternalUserAuth()
  @PrimeTrustJWT()
  public async getBalancePT(ctx: any) {
    try {
      const jwtToken = ctx.request.primeTrustToken;
      let { emails } = ctx.request.body;
      if (!emails || emails.length === 0) {
        return this.BadRequest(ctx, "Please enter emails");
      }
      const users = await userDbService.getUserDetails(emails);
      let dataToSend = await Promise.all(
        users.map(async (user: any) => {
          const fetchBalance: any = await getBalance(
            jwtToken,
            user.accountDetails[0].accountId
          );
          if (fetchBalance.status == 400) {
            return {
              email: user.email,
              balance: 0,
            };
          }
          return {
            email: user.email,
            balance: fetchBalance.data.data[0].attributes.disbursable,
          };
        })
      );
      return this.Ok(ctx, { message: "Success", data: dataToSend });
    } catch (error) {
      return this.BadRequest(ctx, error.message);
    }
  }

  /**
   * @description This method is used to get prime trust balance from user emails
   * @param ctx
   */
  @Route({ path: "/delete-crm-users", method: HttpMethod.DELETE })
  @InternalUserAuth()
  @PrimeTrustJWT(true)
  public async deleteCRMUsers(ctx: any) {
    try {
      const zohoAccessToken = ctx.request.zohoAccessToken;
      const deletedUsersData = await DeletedUserTable.find({});
      let deletedUsers: any = deletedUsersData.map((x) => x.email);
      deletedUsers = [...new Set(deletedUsers)];

      const zohoCrmAccounts = await userDbService.searchAndDeleteZohoAccounts(
        deletedUsers,
        zohoAccessToken
      );
      return this.Ok(ctx, { data: zohoCrmAccounts });
    } catch (error) {
      return this.BadRequest(ctx, error.message);
    }
  }

  /**
   * @description This method is used to get
   * @param ctx
   */
  @Route({ path: "/sync-quiz-in-zoho", method: HttpMethod.POST })
  @InternalUserAuth()
  @PrimeTrustJWT(true)
  public async syncZohoCrmQuizInfoWithDB(ctx: any) {
    try {
      let quizResults: any = await quizDbService.getUsersQuizResult();
      await Promise.all(
        quizResults.map(async (res: any) => {
          const quizDataForCrm = res.quizInformation.map(
            (quizRes: any, quizNumber: number) => {
              return {
                Quiz_Number: quizNumber + 1,
                Quiz_Name: quizRes.quizName,
                Points: quizRes.pointsEarned,
              };
            }
          );
          let dataForCrm: any = [
            {
              Account_Name: res.firstName + " " + res.lastName,
              New_Quiz_Information: quizDataForCrm,
              Email: res.email,
            },
          ];
          await zohoCrmService.addAccounts(
            ctx.request.zohoAccessToken,
            dataForCrm,
            true
          );
        })
      );
      return this.Ok(ctx, { data: quizResults });
    } catch (error) {
      console.log(error);
      return this.BadRequest(ctx, error.message);
    }
  }

  @Route({ path: "/send-referral-push-for-test", method: HttpMethod.POST })
  @InternalUserAuth()
  public async sendReferralPushForTest(ctx: any) {
    const { userId, deviceToken, receiverName } = ctx.request.body;

    await userService.sendNotificationForUserReferral(
      userId,
      [deviceToken],
      NOTIFICATION.REFERRAL_SENDER_MESSAGE,
      receiverName
    );

    return this.Ok(ctx, { message: "success" });
  }

  /**
   * @description This method is used to export csv and get parent-child records with time in between them
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/export-parentchild-info", method: HttpMethod.GET })
  public async exportParentChildInformation(ctx: any) {
    const parentChildRecords = await ScriptService.getParentChildRecords();
    await ScriptService.convertDataToCsv(ctx, parentChildRecords);
    return ctx;
  }

  /**
   * @description This method is used to delete same device token in users
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/remove-same-device-token", method: HttpMethod.DELETE })
  @InternalUserAuth()
  public async removeSameDeviceToken(ctx: any) {
    let deviceTokens = await DeviceToken.aggregate([
      {
        $unwind: {
          path: "$deviceToken",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: "$deviceToken",
          userId: {
            $push: "$userId",
          },
        },
      },
      {
        $addFields: {
          length: {
            $size: "$userId",
          },
        },
      },
      {
        $match: {
          length: {
            $gt: 1,
          },
          _id: {
            $ne: null,
          },
        },
      },
    ]).exec();
    if (deviceTokens.length === 0) {
      return this.Ok(ctx, { message: "No similar device tokens" });
    }
    await Promise.all(
      deviceTokens.map(async (data, index) => {
        await data.userId.map(async (user) => {
          await DeviceToken.updateOne(
            { userId: user },
            {
              $pull: {
                deviceToken: data._id,
              },
            }
          );
        });
        return true;
      })
    );
    return this.Ok(ctx, {
      message: "Same device token deleted successfully",
      data: deviceTokens,
    });
  }

  /*
   * @description This method is used to export csv and get parent-child records with time in between them
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/remove-quiz", method: HttpMethod.DELETE })
  @InternalUserAuth()
  public async removeQuiz(ctx: any) {
    try {
      const { quizNums } = ctx.request.body;
      if (quizNums.length === 0) {
        return this.BadRequest(ctx, "Please enter input quiz numbers");
      }
      let isQuizzesDeleted = await ScriptService.removeQuizFromDb(quizNums);
      if (!isQuizzesDeleted) {
        return this.BadRequest(ctx, "Something Went Wrong");
      }
      return this.Ok(ctx, { message: "Quiz Deleted Successfully" });
    } catch (error) {
      return this.Ok(ctx, { message: error.message });
    }
  }

  /**
   * @description This method is used to sync existing xp of users to zoho
   * @param ctx
   */
  @Route({ path: "/sync-xp-in-zoho", method: HttpMethod.POST })
  @InternalUserAuth()
  @PrimeTrustJWT(true)
  public async syncXPInZoho(ctx: any) {
    try {
      const users = await UserTable.find({
        $and: [
          {
            xpPoints: { $exists: true },
          },
          {
            xpPoints: { $gt: 0 },
          },
        ],
      }).select({
        _id: "-$_id",
        Account_Name: { $concat: ["$firstName", " ", "$lastName"] },
        Email: "$email",
        XP: "$xpPoints",
      });
      if (users.length === 0) return this.BadRequest(ctx, "User not found");
      const zohoCrmObjectSize = 90;
      let crmObject;
      for (let i = 0; i < users.length; i += zohoCrmObjectSize) {
        crmObject = users.slice(i, i + zohoCrmObjectSize);

        /**
         * add account to zoho crm
         */
        await zohoCrmService.addAccounts(
          ctx.request.zohoAccessToken,
          crmObject,
          true
        );
      }
      return this.Ok(ctx, { data: users });
    } catch (error) {
      return this.Ok(ctx, { message: error.message });
    }
  }

  /**
   * @description This method is used to sync existing xp of users to zoho
   * @param ctx
   */
  @Route({ path: "/store-dripshop-items", method: HttpMethod.POST })
  @InternalUserAuth()
  public async storeDripShopItems(ctx: any) {
    try {
      const { items } = ctx.request.body;
      if (items.length === 0) return this.BadRequest(ctx, "Product not found");
      const createdProducts = await DripshopDBService.addItems(items);
      return this.Ok(ctx, { data: createdProducts, message: "Success" });
    } catch (error) {
      return this.BadRequest(ctx, error.message);
    }
  }
}

export default new ScriptController();

/*

- 1.1.1
SIGN_UP = 0,
UPLOAD_DOCUMENTS = 1,
ADD_BANK_ACCOUNT = 2,
SUCCESS = 3,

// for teen
 SIGN_UP_TEEN = 0,
 CREATE_USERNAME = 1,
 ENTER_PHONE_NO = 2,
 ENTER_NAME = 3,
 ENTER_PARENT_INFO = 4,
 SUCCESS_TEEN = 5,
 
 - 1.2
// for parent new, self and teen
 SIGN_UP = 0,
 DOB_SCREEN = 1,
 
// for parent and self
 MYSELF_PARENT_SCREEN = 2,
 DETAIL_SCREEN = 3,
 CHILD_INFO_SCREEN = 4,
 UPLOAD_DOCUMENTS = 5,
 ADD_BANK_ACCOUNT = 6,
 SUCCESS = 7,
 
//  for teen
 ENTER_PHONE_NO = 8,
 ENTER_PARENT_INFO = 9,
 SUCCESS_TEEN = 10,
 
- mapping
 NOT teen:
 SIGN_UP = 0 -----> DOB_SCREEN = 1
 UPLOAD_DOCUMENTS = 1 -----> UPLOAD_DOCUMENTS = 5,
 ADD_BANK_ACCOUNT = 2 -----> ADD_BANK_ACCOUNT = 6,
 SUCCESS = 3 -------> SUCCESS = 7,
 
 teens:
 0 ------> SUCCESS = 10
*/
