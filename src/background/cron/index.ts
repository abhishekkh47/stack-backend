import { getHistoricalDataOfCoins, getLatestPrice } from "../../utility";
import cron from "node-cron";
import { CryptoTable, CryptoPriceTable } from "../../model";

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
              $set: { currentPrice: latestValues.quote["USD"].price },
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
          high365D: historicalValues.periods["365d"].quote["USD"].high,
          low365D: historicalValues.periods["365d"].quote["USD"].low,
          high90D: historicalValues.periods["90d"].quote["USD"].high,
          low90D: historicalValues.periods["90d"].quote["USD"].low,
          currencyType: "USD",
          currentPrice: null,
        };
        await mainArray.push(arrayToInsert);
      }
      await CryptoPriceTable.insertMany(mainArray);
    }
    return true;
  });
};
