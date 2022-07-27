import {
  createContributions,
  getHistoricalDataOfCoins,
  getLatestPrice,
  getPrimeTrustJWTToken,
  sendNotification,
} from "../../utility";
import cron from "node-cron";
import {
  CryptoTable,
  CryptoPriceTable,
  ParentChildTable,
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
            filter: { symbol: latestValues.symbol },
            update: {
              $set: {
                currentPrice: parseFloat(
                  parseFloat(latestValues.quote["USD"].price).toFixed(2)
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
    let jwtToken = await getPrimeTrustJWTToken();
    let users: any = await ParentChildTable.find({
      accessToken: { $ne: null },
    }).populate("userId", [
      "_id",
      "isRecurring",
      "selectedDeposit",
      "selectedDepositDate",
    ]);
    if (users.length > 0) {
      users = users.filter(
        (x) =>
          x.userId && x.userId.isRecurring != 0 && x.userId.isRecurring != 1
      );
      console.log(users.length, "users");
      let todayDate = moment().startOf("day").unix();
      if (users.length > 0) {
        let transactionArray = [];
        let mainArray = [];
        let activityArray = [];
        for await (let user of users) {
          const accountIdDetails = await user.teens.find(
            (x: any) => x.childId.toString() == user.firstChildId.toString()
          );
          if (!accountIdDetails) {
            return false;
          }
          let selectedDate = moment(user.userId.selectedDepositDate)
            .startOf("day")
            .unix();
          console.log(selectedDate, "selectedDate");
          console.log(todayDate, "todayDate");
          console.log(selectedDate <= todayDate, "todayDate");
          if (selectedDate <= todayDate) {
            console.log("selectedDate");
            /**
             * create fund transfer with fund transfer id in response
             */
            let contributionRequest = {
              type: "contributions",
              attributes: {
                "account-id": accountIdDetails.accountId,
                "contact-id": user.contactId,
                "funds-transfer-method": {
                  "funds-transfer-type": "ach",
                  "ach-check-type": "personal",
                  "contact-id": user.contactId,
                  "plaid-processor-token": user.processorToken,
                },
                amount: user.userId.selectedDeposit,
              },
            };
            let contributions: any = await createContributions(
              jwtToken,
              contributionRequest
            );
            if (contributions.status == 400) {
              let deviceTokenData = await DeviceToken.findOne({
                userId: user.userId,
              }).select("deviceToken");
              /**
               * Notification
               */
              if (deviceTokenData) {
                let notificationRequest = {
                  key: NOTIFICATION_KEYS.RECURRING_FAILED,
                  title: NOTIFICATION.RECURRING_FAILED,
                };
                await sendNotification(
                  deviceTokenData.deviceToken,
                  notificationRequest.title,
                  notificationRequest
                );
                await Notification.create({
                  title: notificationRequest.title,
                  userId: user.userId,
                  message: null,
                  isRead: ERead.UNREAD,
                  data: JSON.stringify(notificationRequest),
                });
              }
              return false;
            }
            let activityData = {
              userId: accountIdDetails.childId,
              userType: EUserType.TEEN,
              message: `${messages.RECURRING_DEPOSIT} $${user.userId.selectedDeposit}`,
              currencyType: null,
              currencyValue: user.userId.selectedDeposit,
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
              amount: user.userId.selectedDeposit,
              amountMod: null,
              userId: accountIdDetails.childId,
              parentId: user.userId,
              status: ETransactionStatus.PENDING,
              executedQuoteId: contributions.data.included[0].id,
              unitCount: null,
            };
            await transactionArray.push(transactionData);
            let bulWriteOperation = {
              updateOne: {
                filter: { _id: user.userId },
                update: {
                  $set: {
                    selectedDepositDate: moment(user.userId.selectedDepositDate)
                      .utc()
                      .startOf("day")
                      .add(
                        user.userId.isRecurring == ERECURRING.WEEKLY
                          ? 7
                          : user.userId.isRecurring == ERECURRING.MONTLY
                          ? 1
                          : user.userId.isRecurring == ERECURRING.QUATERLY
                          ? 4
                          : 0,
                        user.userId.isRecurring == ERECURRING.WEEKLY
                          ? "days"
                          : user.userId.isRecurring == ERECURRING.MONTLY
                          ? "months"
                          : user.userId.isRecurring == ERECURRING.QUATERLY
                          ? "months"
                          : "day"
                      ),
                  },
                },
              },
            };
            await mainArray.push(bulWriteOperation);
          }
        }
        console.log(transactionArray, "transactionArray");
        console.log(mainArray, "mainArray");
        console.log(activityArray, "activityArray");
        await TransactionTable.insertMany(transactionArray);
        await UserActivityTable.insertMany(activityArray);
        await UserTable.bulkWrite(mainArray);
        return true;
      } else {
        return false;
      }
    }
    return false;
  });
};
