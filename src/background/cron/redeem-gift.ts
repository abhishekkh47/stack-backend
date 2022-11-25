import {
  getAllGiftCards,
  getPrimeTrustJWTToken,
  sendNotification,
} from "../../utility";
import {
  CryptoTable,
  TransactionTable,
  UserTable,
  UserActivityTable,
  DeviceToken,
  Notification,
  UserGiftCardTable,
} from "../../model";
import moment from "moment";
import {
  ETransactionStatus,
  ETransactionType,
  EAction,
  EStatus,
  ERead,
} from "../../types";
import {
  GIFTCARDS,
  NOTIFICATION,
  NOTIFICATION_KEYS,
} from "../../utility/constants";
import userService from "../../services/user.service";
import tradingService from "../../services/trading.service";
import config from "../../config";

export const redeemGiftHandler = async () => {
  console.log(`
  ==========Start Cron For Redeeming Gift Card=============
 `);
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
            let deviceTokenData = await DeviceToken.findOne({
              userId: kycApproved.childId,
            }).select("deviceToken");
            if (deviceTokenData) {
              let notificationRequest = {
                key: NOTIFICATION_KEYS.GIFT_CARD_ISSUED,
                title: NOTIFICATION.GIFT_CARD_REDEEMED,
                message: NOTIFICATION.GIFT_CARD_REDEEM_MESSAGE.replace(
                  "{amount}",
                  getDate.amount.toString()
                ).replace("{sender}", getDate.sender_name),
              };
              await sendNotification(
                deviceTokenData.deviceToken,
                notificationRequest.title,
                notificationRequest
              );
              notificationArray.push({
                title: notificationRequest.title,
                userId: kycApproved.childId,
                message: notificationRequest.message,
                isRead: ERead.UNREAD,
                data: JSON.stringify(notificationRequest),
              });
            }
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

  return true;
};
