import { getHistoricalDataOfCoins } from "../../utility";
import { CryptoTable, CryptoPriceTable } from "../../model";

export const historicalPriceHandler = async () => {
  console.log("==========Start Cron for historical price=============");
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
    for (let historicalValues of historicalData) {
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
      mainArray.push(arrayToInsert);
    }
    await CryptoPriceTable.insertMany(mainArray);
  }
  return true;
};
