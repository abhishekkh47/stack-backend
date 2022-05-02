import axios from "axios";
import config from "../config/index";
import { COINMARKETCAPAPIS } from "./constants";

const headers = {
  "X-CMC_PRO_API_KEY": "ed20c87a-acef-4d7a-baf5-4b84ace77579",
};

/**
 * @description This api is used to get historical data of coins
 * @param token
 * @returns {*}
 */
export const getHistoricalDataOfCoins = async (symbols) => {
  const response = await axios
    .get(
      config.COINMARKETCAPAPI_URL + COINMARKETCAPAPIS.historicalPrice(symbols),
      {
        headers: headers,
      }
    )
    .then((res) => {
      return {
        status: 200,
        data: res.data.data,
      };
    })
    .catch((error) => {
      if (error) {
        return {
          status: error.response,
          message: error.response.data,
        };
      }
    });
  return response;
};

/**
 * @description This api is used to get latest price of crypto
 * @param token
 * @returns {*}
 */
export const getLatestPrice = async (symbols) => {
  const response = await axios
    .get(config.COINMARKETCAPAPI_URL + COINMARKETCAPAPIS.latestPrice(symbols), {
      headers: headers,
    })
    .then((res) => {
      return {
        status: 200,
        data: res.data.data,
      };
    })
    .catch((error) => {
      if (error) {
        return {
          status: error.response,
          message: error.response.data,
        };
      }
    });
  return response;
};
