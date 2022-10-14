import { UserBanksTable } from './../../model/user-banks';
import {
  createContributions,
  depositAmount,
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
import { NOTIFICATION, NOTIFICATION_KEYS } from "../../utility/constants";
import mongoose from "mongoose";

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
                currentPrice: latestValues && parseFloat(
                  parseFloat(latestValues.quote["USD"].price).toFixed(2)
                ),
                percent_change_30d:  latestValues && parseFloat(
                  parseFloat(latestValues.quote["USD"].percent_change_30d).toFixed(2))
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
  cron.schedule("0 0 * * *", async () => {
    console.log(`
     ==========Start Cron=============
    `);
    let cryptos: any = await CryptoTable.find({});
    let symbolList = cryptos.map((x) => x.symbol).toString();
    let historicalData: any = await getHistoricalDataOfCoins(symbolList);
    let mainArray = [];
    if (historicalData) {
      historicalData = Object.values(historicalData.data);
      if (historicalData.length == 0) {
        return false;
      }
      await CryptoPriceTable.deleteMany({});
      for await (let historicalValues of historicalData) {
        historicalValues = historicalValues[0];
        let arrayToInsert = {
          name: historicalValues.name,
          symbol: historicalValues.symbol,
          assetId: cryptos.find((x) => x.symbol == historicalValues.symbol)
            ? cryptos.find((x) => x.symbol == historicalValues.symbol).assetId
            : null,
          cryptoId: cryptos.find((x) => x.symbol == historicalValues.symbol)
            ? cryptos.find((x) => x.symbol == historicalValues.symbol)._id
            : null,
          high365D: parseFloat(
            parseFloat(
              historicalValues.periods["365d"].quote["USD"].high
            ).toFixed(2)
          ),
          low365D: parseFloat(
            parseFloat(
              historicalValues.periods["365d"].quote["USD"].low
            ).toFixed(2)
          ),
          high90D: parseFloat(
            parseFloat(
              historicalValues.periods["90d"].quote["USD"].high
            ).toFixed(2)
          ),
          low90D: parseFloat(
            parseFloat(
              historicalValues.periods["90d"].quote["USD"].low
            ).toFixed(2)
          ),
          currencyType: "USD",
          currentPrice: null,
        };
        await mainArray.push(arrayToInsert);
      }
      await CryptoPriceTable.insertMany(mainArray);
    }
    return true;
  });

  /**
   * Logic for recurring deposit if user has selected recurring deposit
   * Time:- at 00:00 am every day
   */
   cron.schedule("0 0 * * *", async () => {
    console.log(`
     ==========Start Cron For Recurring=============
    `);
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
    ] ).exec();
    if (users.length > 0) {

      let todayDate = moment().startOf("day").unix();
      let transactionArray = [];
      let mainArray = [];
      let activityArray = [];
      let accountIdDetails: any;
      for await (let user of users) {
        if(user.type == EUserType.SELF) {
          accountIdDetails = await user.self.find(
            (x: any) => x.userId.toString() == user._id.toString()
            );
        } else {
          accountIdDetails = await user.parentChild?.teens.find(
            (x: any) => x.childId.toString() == user._id.toString()
            );
        }
      
 
        if (!accountIdDetails) {
          continue;
        }
        let deviceTokenData = await DeviceToken.findOne({
          userId: user.type == EUserType.SELF ? user.self.userId : user.parentChild.userId,
        }).select("deviceToken");
        let selectedDate = moment(user.selectedDepositDate)
        .startOf("day")
        .unix();
        if (selectedDate <= todayDate) {
        const userInfo = await UserBanksTable.findOne({
          $or: [
            { userId: accountIdDetails.userId },
            { parentId: accountIdDetails.userId },
          ],
        });
          const deposit: any = await depositAmount(userInfo.relationshipId, user.selectedDeposit, accountIdDetails.accountId)

          if (deposit.status === 422) {
            /**
             * Notification
             */
            if (deviceTokenData) {
              let notificationRequest = {
                key:
                deposit.status == 422
                    ? NOTIFICATION_KEYS.RECURRING_FAILED_BANK
                    : NOTIFICATION_KEYS.RECURRING_FAILED_BALANCE,
                title: "Recurring Deposit Error",
                message:
                deposit.status == 422
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
              resourceId: deposit.data.id,
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
              parentId: user.type == EUserType.SELF ? user.self.userId : user.parentChild.userId,
              status: ETransactionStatus.PENDING,
              executedQuoteId: deposit.data.id,
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
};
