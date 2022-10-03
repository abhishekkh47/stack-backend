import axios from "axios";
import config from "../config";
import { ALPACAAPI } from "../utility/constants";

/**
 * @description This api is used to get all the asset crypto
 */
 export const getAssetCrypto = async () => {
  const headers: any = {
    auth : {
      username: config.ALPACA_API_KEY,
      password: config.ALPACA_API_SECRET,
   }
    
  };
  const response = await axios
    .get(`${config.ALPACA_HOST}${ALPACAAPI.getAssetCrypto}`, 
      headers
    )
    .then((res) => {
      return {
        status: 200,
        data: res.data,
      };
    })
    .catch((error) => {
      if (error) {
        return {
          status: error.response.status,
          message: error.response.data.error_message,
          error_code: error.response.data.error_code,
        };
      }
    });
  return response;
};
