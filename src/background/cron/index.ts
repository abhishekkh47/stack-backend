import {
  createContributions,
  getAllGiftCards,
  getBalance,
  getHistoricalDataOfCoins,
  getLatestPrice,
  getPrimeTrustJWTToken,
  sendNotification,
} from "../../utility";
import cron from "node-cron";
import {
  CryptoTable,
  CryptoPriceTable,
  TransactionTable,
  UserTable,
  UserActivityTable,
  DeviceToken,
  Notification,
  UserBanksTable,
  UserGiftCardTable,
} from "../../model";
import moment from "moment";
import {
  ETransactionStatus,
  ETransactionType,
  ERECURRING,
  EUserType,
  EAction,
  EStatus,
  messages,
  ERead,
} from "../../types";
import {
  GIFTCARDS,
  NOTIFICATION,
  NOTIFICATION_KEYS,
} from "../../utility/constants";
import mongoose from "mongoose";
import userService from "../../services/user.service";
import tradingService from "../../services/trading.service";

export const startCron = () => {
  /**
   * Logic for getting crypto current price
   * Time:- at every 10 minutes
   */
  cron.schedule("*/10 * * * *", async () => {
    console.log(`
     ==========Start Cron=============
    `);
    let cryptos: any = await CryptoTable.find({});
    let symbolList = cryptos.map((x) => x.symbol).toString();
    let latestPrice: any = await getLatestPrice(symbolList);
    let mainArray = [];
    if (latestPrice) {
      latestPrice = Object.values(latestPrice.data);
      if (latestPrice.length == 0) {
        return false;
      }
      for await (let latestValues of latestPrice) {
        latestValues = latestValues[0];
        let bulWriteOperation = {
          updateOne: {
            filter: { symbol: latestValues && latestValues.symbol },
            update: {
              $set: {
                currentPrice:
                  latestValues &&
                  parseFloat(
                    parseFloat(latestValues.quote["USD"].price).toFixed(2)
                  ),
                percent_change_30d:
                  latestValues &&
                  parseFloat(
                    parseFloat(
                      latestValues.quote["USD"].percent_change_30d
                    ).toFixed(2)
                  ),
              },
            },
          },
        };
        await mainArray.push(bulWriteOperation);
      }
      await CryptoPriceTable.bulkWrite(mainArray);
    }
    return true;
  });

  /**
   * Logic for getting crypto historical price
   * Time:- at 00:00 am every day
   */
  // cron.schedule("0 0 * * *", async () => {
  //   console.log(`
  //    ==========Start Cron=============
  //   `);
  //   let cryptos: any = await CryptoTable.find({});
  //   let symbolList = cryptos.map((x) => x.symbol).toString();
  //   let historicalData: any = await getHistoricalDataOfCoins(symbolList);
  //   let mainArray = [];
  //   if (historicalData) {
  //     historicalData = Object.values(historicalData.data);
  //     if (historicalData.length == 0) {
  //       return false;
  //     }
  //     await CryptoPriceTable.deleteMany({});
  //     for await (let historicalValues of historicalData) {
  //       historicalValues = historicalValues[0];
  //       let arrayToInsert = {
  //         name: historicalValues.name,
  //         symbol: historicalValues.symbol,
  //         assetId: cryptos.find((x) => x.symbol == historicalValues.symbol)
  //           ? cryptos.find((x) => x.symbol == historicalValues.symbol).assetId
  //           : null,
  //         cryptoId: cryptos.find((x) => x.symbol == historicalValues.symbol)
  //           ? cryptos.find((x) => x.symbol == historicalValues.symbol)._id
  //           : null,
  //         high365D: parseFloat(
  //           parseFloat(
  //             historicalValues.periods["365d"].quote["USD"].high
  //           ).toFixed(2)
  //         ),
  //         low365D: parseFloat(
  //           parseFloat(
  //             historicalValues.periods["365d"].quote["USD"].low
  //           ).toFixed(2)
  //         ),
  //         high90D: parseFloat(
  //           parseFloat(
  //             historicalValues.periods["90d"].quote["USD"].high
  //           ).toFixed(2)
  //         ),
  //         low90D: parseFloat(
  //           parseFloat(
  //             historicalValues.periods["90d"].quote["USD"].low
  //           ).toFixed(2)
  //         ),
  //         currencyType: "USD",
  //         currentPrice: null,
  //       };
  //       await mainArray.push(arrayToInsert);
  //     }
  //     await CryptoPriceTable.insertMany(mainArray);
  //   }
  //   return true;
  // });

  /**
   * Logic for recurring deposit if user has selected recurring deposit
   * Time:- at 00:00 am every day
   */
  cron.schedule("0 0 * * *", async () => {
    console.log(`
     ==========Start Cron For Recurring=============
    `);
    let token = await getPrimeTrustJWTToken();
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
      {
        $lookup: {
          from: "parentchild",
          localField: "_id",
          foreignField: "firstChildId",
          as: "self",
        },
      },
      { $unwind: { path: "$self", preserveNullAndEmptyArrays: true } },
    ]).exec();
    if (users.length > 0) {
      let todayDate = moment().startOf("day").unix();
      let transactionArray = [];
      let mainArray = [];
      let activityArray = [];
      let accountIdDetails: any;
      for await (let user of users) {
        accountIdDetails = await user.parentChild?.teens.find(
          (x: any) => x.childId.toString() == user._id.toString()
        );
        if (!accountIdDetails) {
          accountIdDetails =
            (await user.self.userId.toString()) == user._id.toString() &&
            user.self;
          if (!accountIdDetails) {
            continue;
          }
        }

        let deviceTokenData = await DeviceToken.findOne({
          userId:
            user.type == EUserType.SELF
              ? user.self.userId
              : user.parentChild.userId,
        }).select("deviceToken");
        let selectedDate = moment(user.selectedDepositDate)
          .startOf("day")
          .unix();
        if (selectedDate <= todayDate) {
          const id =
            user.type == EUserType.SELF
              ? user.self.userId
              : user.parentChild.userId;
          const userInfo = await UserBanksTable.findOne({
            $or: [{ userId: id }, { parentId: id }],
            $and: [{ isDefault: 1 }],
          });
          let contactId =
            user.type == EUserType.SELF
              ? user.self.contactId
              : user.parentChild.contactId;
          let contributionRequest = {
            type: "contributions",
            attributes: {
              "account-id": accountIdDetails.accountId,
              "contact-id": contactId,
              "funds-transfer-method": {
                "funds-transfer-type": "ach",
                "ach-check-type": "personal",
                "contact-id": contactId,
                "plaid-processor-token": userInfo.processorToken,
              },
              amount: user.selectedDeposit,
            },
          };
          let contributions: any = await createContributions(
            token.data,
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
                userId:
                  user.type == EUserType.SELF
                    ? user.self.userId
                    : user.parentChild.userId,
                message: null,
                isRead: ERead.UNREAD,
                data: JSON.stringify(notificationRequest),
              });
            }
            continue;
          } else {
            let activityData = {
              userId: user._id,
              userType:
                user.type == EUserType.SELF ? EUserType.SELF : EUserType.TEEN,
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
              parentId:
                user.type == EUserType.SELF
                  ? user.self.userId
                  : user.parentChild.userId,
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
        }
      }
      await UserActivityTable.insertMany(activityArray);
      await TransactionTable.insertMany(transactionArray);
      await UserTable.bulkWrite(mainArray);
      return true;
    }
    return true;
  });

  /**
   * Logic for redeeming gift card
   * Time: at every 15 mins
   */
  cron.schedule("*/15 * * * *", async () => {
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
  });
};
