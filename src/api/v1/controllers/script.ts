import { NOTIFICATION, NOTIFICATION_KEYS } from "../../../utility/constants";
import moment from "moment";
import { PrimeTrustJWT } from "../../../middleware";
import {
  AdminTable,
  CryptoPriceTable,
  CryptoTable,
  DeviceToken,
  Notification,
  UserBanksTable,
  UserGiftCardTable,
  UserTable,
} from "../../../model";
import tradingService from "../../../services/trading.service";
import userService from "../../../services/user.service";
import {
  EAction,
  ERead,
  EStatus,
  ETransactionStatus,
  EUserType,
  HttpMethod,
} from "../../../types";
import {
  getAllGiftCards,
  getAssets,
  getHistoricalDataOfCoins,
  Route,
  sendNotification,
} from "../../../utility";
import { ParentChildTable } from "./../../../model/parentChild";
import { TransactionTable } from "./../../../model/transactions";
import { UserActivityTable } from "./../../../model/useractivity";
import BaseController from "./base";

class ScriptController extends BaseController {
  /**
   * @description This method is for updating screen status by script for migration into production
   * @param ctx
   * @returns
   */
  @Route({ path: "/update-screen-status-script", method: HttpMethod.POST })
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
   * @description This method is for updating user banks by script for migration into production
   * @param ctx
   * @returns
   */
  @Route({ path: "/migrate-userbanks", method: HttpMethod.POST })
  public async updateUserBanksDataScript(ctx: any) {
    let banksArray = [];
    let query = {};
    if (ctx.request.body.userId) {
      query = { ...query, userId: ctx.request.body.userId };
    }
    let BanksData = await ParentChildTable.find(query);
    for await (let bankInfo of BanksData) {
      console.log("userId for banks", bankInfo.userId);
      banksArray.push({
        userId: bankInfo.userId,
        parentId: bankInfo.userId,
        status: 2,
        processorToken: bankInfo.processorToken,
        insId: bankInfo.institutionId,
        accessToken: bankInfo.accessToken,
        isDefault: 1,
      });
    }
    const response = await UserBanksTable.insertMany(banksArray);

    return this.Ok(ctx, { message: "Successfull Migration", data: response });
  }

  /**
   * @description This method is for adding crypto from pt in staging and production
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/add-crypto-in-db", method: HttpMethod.POST })
  @PrimeTrustJWT()
  public async addCryptoToDB(ctx: any) {
    let token = ctx.request.primeTrustToken;
    let symbol = ctx.request.body.symbol;
    if (!symbol) {
      return this.BadRequest(ctx, "Please enter crypto");
    }
    /**
     * get the asset data for avalanche
     */
    let assets: any = await getAssets(token, 1, 500);
    assets = await assets.data.data.filter(
      (x) => x.attributes["unit-name"] === symbol
    );
    let array = [];
    for await (const iterator of assets) {
      array.push({
        name: iterator.attributes["name"],
        symbol: iterator.attributes["unit-name"],
        assetId: iterator.id,
      });
    }
    const added = await CryptoTable.create(array[0]);
    if (added) {
      /**
       * get historical data for symbol
       */
      let historicalData: any = await getHistoricalDataOfCoins(added.symbol);
      const historicalValues = historicalData.data[symbol][0];
      let arrayToInsert = {
        name: historicalValues.name,
        symbol: historicalValues.symbol,
        assetId: added.assetId,
        cryptoId: added._id,
        high365D: parseFloat(
          parseFloat(
            historicalValues.periods["365d"].quote["USD"].high
          ).toFixed(2)
        ),
        low365D: parseFloat(
          parseFloat(historicalValues.periods["365d"].quote["USD"].low).toFixed(
            2
          )
        ),
        high90D: parseFloat(
          parseFloat(historicalValues.periods["90d"].quote["USD"].high).toFixed(
            2
          )
        ),
        low90D: parseFloat(
          parseFloat(historicalValues.periods["90d"].quote["USD"].low).toFixed(
            2
          )
        ),
        currencyType: "USD",
        currentPrice: null,
      };

      await CryptoPriceTable.create(arrayToInsert);
    }

    return this.Ok(ctx, { message: assets });
  }

  /**
   * @description This method is used to integrate gift card api
   * @param ctx
   * @return {*}
   */
  @Route({ path: "/add-gift-card", method: HttpMethod.POST })
  @PrimeTrustJWT()
  public async addGiftCard(ctx: any) {
    let token = ctx.request.primeTrustToken;
    let admin = await AdminTable.findOne({});
    const crypto = await CryptoTable.findOne({ symbol: "BTC" });
    /**
     * to get all the gift cards from shopify
     */
    let allGiftCards: any = await getAllGiftCards();

    /**
     * to get already existing uuids
     */
    let giftCardArray = [];
    let getAllUUIDs = await UserGiftCardTable.find({}, { uuid: 1, _id: 0 });

    /**
     * enter all the new entries in an array
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
    console.log("getRequiredGiftInfo: ", getRequiredGiftInfo);

    /**
     * condition of date to check whether add or not
     */
    let todayDate, dateToSend, updateQuery;
    if (getRequiredGiftInfo && getRequiredGiftInfo.length > 0) {
      let pushTransactionArray = [];
      let pushUserActivityArray = [];
      todayDate = moment().startOf("day").unix(); // today's date
      for await (let getDate of getRequiredGiftInfo) {
        dateToSend = moment(getDate.send_on_date).startOf("day").unix(); // date to send the card on

        /**
         * to check kyc approved or not and also get the userId and childId
         */
        let kycApproved: any = await userService.getKycApproved(
          getDate.recieptent_email
        );

        /**
         * query to update in case of kyc approved and send on date less than or equals to today's date
         */
        updateQuery = {
          uuid: getDate.uuid,
        };

        if (dateToSend <= todayDate && kycApproved.status) {
          /**
           * used to do internal transfer for the given amount
           */
          let internalTranfser = await tradingService.internalTransferAction(
            kycApproved.userId,
            kycApproved.childId,
            token,
            getDate.amount
          );
          console.log("internalTranfser: ", internalTranfser);

          if (internalTranfser.giftCardStatus) {
            updateQuery = {
              ...updateQuery,
              $set: {
                redeemed: true,
              },
            };

            /**
             * array containing all enteries of transactions
             */
            pushTransactionArray.push({
              status: ETransactionStatus.GIFTED,
              userId: kycApproved.childId,
              executedQuoteId: internalTranfser.internalTransferId,
              unitCount: internalTranfser.executedQuoteUnitCount,
              accountId: internalTranfser.accountId,
              amountMod: -admin.giftCryptoAmount,
              amount: getDate.amount,
              settledTime: moment().unix(),
              cryptoId: crypto._id,
              assetId: crypto.assetId,
            });
            console.log("pushTransactionArray: ", pushTransactionArray);

            /**
             * array containing all the activities
             */
            console.log("getDate.amount: ", getDate.amount);
            pushUserActivityArray.push({
              userId: kycApproved.childId,
              userType: kycApproved.type,
              message: `Redeemed ${getDate.amount} Bitcoin Gift Card from ${getDate.sender_name} `,
              currencyType: null,
              currencyValue: getDate.amount,
              action: EAction.BUY_CRYPTO,
              status: EStatus.PROCESSED,
              cryptoId: crypto._id,
              assetId: crypto.assetId,
            });
            console.log("pushUserActivityArray: ", pushUserActivityArray);

            /**
             * for push notification
             */

            let deviceTokenData = await DeviceToken.findOne({
              userId: kycApproved.childId,
            }).select("deviceToken");
            if (deviceTokenData) {
              let notificationRequest = {
                key: NOTIFICATION_KEYS.GIFT_CARD_ISSUED,
                title: NOTIFICATION.GIFT_CARD_REDEEMED,
                message: `🎉 Your ${getDate.amount} BTC Gift Card from ${getDate.sender_name} is redeemed. Check out your latest portfolio 🤩`,
              };
              await sendNotification(
                deviceTokenData.deviceToken,
                notificationRequest.title,
                notificationRequest
              );
              await Notification.create({
                title: notificationRequest.title,
                userId: kycApproved.childId,
                message: notificationRequest.message,
                isRead: ERead.UNREAD,
                data: JSON.stringify(notificationRequest),
              });
            }
          }
        }

        await UserGiftCardTable.updateOne(updateQuery);
      }
      await TransactionTable.insertMany(pushTransactionArray);
      await UserActivityTable.insertMany(pushUserActivityArray);
    }

    return this.Ok(ctx, { data: allGiftCards });
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
