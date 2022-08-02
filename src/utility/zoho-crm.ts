import config from "../config";
import axios from "axios";
import { ZOHOAPIS } from "./constants";

/**
 * @description This api is used to get access token for zoho crm
 * @expiry 1hour expiry time
 */
export const getAccessToken = async (refreshToken) => {
  const response = await axios
    .post(
      `${config.ZOHO_ACCOUNTURL + ZOHOAPIS.getAccessToken}?client_id=${
        config.ZOHO_CLIENTID
      }&client_secret=${
        config.ZOHO_SECRETID
      }&grant_type=refresh_token&refresh_token=${refreshToken}`
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
        };
      }
    });
  return response;
};

/**
 * @description This api is used to get add account info in zoho crm
 */
export const addAccountInfoInZohoCrm = async (accessToken, data) => {
  const response = await axios
    .post(config.ZOHO_DOMAIN + ZOHOAPIS.accountUpsert, data, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
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
          message: error.response.data,
        };
      }
    });
  return response;
};

/**
 * @description This api is used to get account information
 */
export const getAccountInfo = async (accessToken) => {
  const response = await axios
    .get(config.ZOHO_DOMAIN + ZOHOAPIS.getAccounts, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
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
          message: error.response.data,
        };
      }
    });
  return response;
};
