import { getLatestPrice } from "../../utility";
import { CryptoTable, CryptoPriceTable } from "../../model";

export const priceHandler = async () => {
  console.log('==========Start Cron for price=============');
  let cryptos: any = await CryptoTable.find({});
  let symbolList = cryptos.map((x) => x.symbol).toString();
  let latestPrice: any = await getLatestPrice(symbolList);
  let mainArray = [];
  if (latestPrice) {
    latestPrice = Object.values(latestPrice.data);
    if (latestPrice.length == 0) {
      return false;
    }
    for (let latestValues of latestPrice) {
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
      mainArray.push(bulWriteOperation);
    }
    await CryptoPriceTable.bulkWrite(mainArray);
  }
  return true;
}
